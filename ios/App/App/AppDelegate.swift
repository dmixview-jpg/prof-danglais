import UIKit
import Capacitor
import AVFoundation
import Speech

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Sons et voix de l'app : lus même quand l'iPhone est en mode silencieux,
        // en se mêlant à la musique éventuelle au lieu de la couper.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// Écran principal de l'app : enregistre les modules natifs propres à l'app.
class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ReconnaissanceVocalePlugin())
    }
}

// Reconnaissance vocale de l'exercice « Dis cette phrase à voix haute » (anglais américain).
// La page appelle ecouter() : le micro écoute jusqu'à un court silence, puis renvoie jusqu'à 3 transcriptions.
@objc(ReconnaissanceVocalePlugin)
public class ReconnaissanceVocalePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ReconnaissanceVocalePlugin"
    public let jsName = "ReconnaissanceVocale"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ecouter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "arreter", returnType: CAPPluginReturnPromise),
    ]

    private let moteur = AVAudioEngine()
    private var requete: SFSpeechAudioBufferRecognitionRequest?
    private var tache: SFSpeechRecognitionTask?
    private var appel: CAPPluginCall?
    private var textes: [String] = []
    private var silence: DispatchWorkItem?
    private var limite: DispatchWorkItem?

    @objc func ecouter(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { statut in
            guard statut == .authorized else { call.reject("not-allowed"); return }
            AVAudioSession.sharedInstance().requestRecordPermission { accorde in
                DispatchQueue.main.async {
                    guard accorde else { call.reject("not-allowed"); return }
                    self.demarrer(call)
                }
            }
        }
    }

    @objc func arreter(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.requete?.endAudio() }
        call.resolve()
    }

    private func demarrer(_ call: CAPPluginCall) {
        terminer()
        guard let reconnaisseur = SFSpeechRecognizer(locale: Locale(identifier: "en-US")), reconnaisseur.isAvailable else {
            call.reject("unavailable")
            return
        }
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .mixWithOthers])
            try session.setActive(true)
        } catch {
            call.reject("audio")
            return
        }
        let requete = SFSpeechAudioBufferRecognitionRequest()
        requete.shouldReportPartialResults = true
        self.requete = requete
        let entree = moteur.inputNode
        entree.removeTap(onBus: 0)
        entree.installTap(onBus: 0, bufferSize: 1024, format: entree.outputFormat(forBus: 0)) { tampon, _ in
            requete.append(tampon)
        }
        moteur.prepare()
        do {
            try moteur.start()
        } catch {
            terminer()
            call.reject("audio")
            return
        }
        appel = call
        textes = []
        tache = reconnaisseur.recognitionTask(with: requete) { [weak self] resultat, erreur in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let resultat = resultat {
                    self.textes = resultat.transcriptions.prefix(3).map { $0.formattedString }
                    self.notifyListeners("partiel", data: ["texte": resultat.bestTranscription.formattedString])
                    self.attendreSilence()
                    if resultat.isFinal { self.rendre() }
                } else if erreur != nil {
                    self.rendre()
                }
            }
        }
        // Au plus 10 secondes d'écoute.
        let fin = DispatchWorkItem { [weak self] in self?.requete?.endAudio() }
        limite = fin
        DispatchQueue.main.asyncAfter(deadline: .now() + 10, execute: fin)
    }

    // 1,5 seconde sans nouveau mot : la phrase est finie.
    private func attendreSilence() {
        silence?.cancel()
        let fin = DispatchWorkItem { [weak self] in self?.requete?.endAudio() }
        silence = fin
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: fin)
    }

    private func rendre() {
        guard let call = appel else { return }
        appel = nil
        let resultat = textes
        terminer()
        call.resolve(["textes": resultat])
    }

    private func terminer() {
        silence?.cancel()
        limite?.cancel()
        if moteur.isRunning { moteur.stop() }
        moteur.inputNode.removeTap(onBus: 0)
        requete?.endAudio()
        requete = nil
        tache?.cancel()
        tache = nil
        // Retour au mode lecture de l'app (voix et sons, même en mode silencieux).
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
    }
}
