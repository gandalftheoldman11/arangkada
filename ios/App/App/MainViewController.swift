import UIKit
import Capacitor

/// Registers Arangkada's own native plugins (Capacitor finds npm plugins automatically).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LiveActivityPlugin())
    }
}
