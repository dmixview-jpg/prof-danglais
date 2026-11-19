package ca.profdanglais.app;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

/**
 * Reconnaissance vocale de l'exercice « Dis cette phrase à voix haute » (anglais américain).
 * ecouter() écoute jusqu'à la fin de la phrase et renvoie jusqu'à 3 transcriptions.
 */
@CapacitorPlugin(
    name = "ReconnaissanceVocale",
    permissions = { @Permission(alias = "micro", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class ReconnaissanceVocalePlugin extends Plugin {

    private SpeechRecognizer reconnaisseur;

    @PluginMethod
    public void ecouter(PluginCall call) {
        if (getPermissionState("micro") != PermissionState.GRANTED) {
            requestPermissionForAlias("micro", call, "apresPermission");
            return;
        }
        demarrer(call);
    }

    @PermissionCallback
    private void apresPermission(PluginCall call) {
        if (getPermissionState("micro") == PermissionState.GRANTED) {
            demarrer(call);
        } else {
            call.reject("not-allowed");
        }
    }

    @PluginMethod
    public void arreter(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (reconnaisseur != null) reconnaisseur.stopListening();
        });
        call.resolve();
    }

    private void demarrer(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("unavailable");
                return;
            }
            if (reconnaisseur != null) reconnaisseur.destroy();
            reconnaisseur = SpeechRecognizer.createSpeechRecognizer(getContext());
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            reconnaisseur.setRecognitionListener(new RecognitionListener() {
                private boolean fini = false;

                private void rendre(ArrayList<String> textes) {
                    if (fini) return;
                    fini = true;
                    JSArray liste = new JSArray();
                    if (textes != null) for (String t : textes) liste.put(t);
                    JSObject ret = new JSObject();
                    ret.put("textes", liste);
                    call.resolve(ret);
                }

                @Override
                public void onResults(Bundle resultats) {
                    rendre(resultats.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION));
                }

                @Override
                public void onPartialResults(Bundle resultats) {
                    ArrayList<String> textes = resultats.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (textes != null && !textes.isEmpty()) {
                        JSObject data = new JSObject();
                        data.put("texte", textes.get(0));
                        notifyListeners("partiel", data);
                    }
                }

                @Override
                public void onError(int erreur) {
                    if (fini) return;
                    if (erreur == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                        fini = true;
                        call.reject("not-allowed");
                    } else {
                        rendre(null); // rien entendu, délai dépassé… : la page propose de réessayer
                    }
                }

                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onEvent(int eventType, Bundle params) {}
            });
            reconnaisseur.startListening(intent);
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (reconnaisseur != null) reconnaisseur.destroy();
        reconnaisseur = null;
    }
}
