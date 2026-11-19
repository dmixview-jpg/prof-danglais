package ca.profdanglais.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Modules natifs propres à l'app : à enregistrer avant le démarrage du pont Capacitor.
        registerPlugin(ReconnaissanceVocalePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
