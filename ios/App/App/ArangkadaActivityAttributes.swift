import Foundation
#if canImport(ActivityKit)
import ActivityKit

/// What the lock-screen Live Activity shows. Shared by the app (which starts and updates it)
/// and the widget extension (which draws it).
@available(iOS 16.1, *)
public struct ArangkadaActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var speed: Int            // current speed, rounded
        public var unit: String          // "km/h" or "mph"
        public var distance: String      // "12.40"
        public var distUnit: String      // "km" or "mi"
        public var top: Int              // top speed this ride
        public var limit: Int            // alert speed
        public var over: Bool            // currently above the alert speed
        public var paused: Bool
        public var rideSince: Date       // now − ride time: lets the timer tick on its own
        public var rideSeconds: Int      // shown as a fixed time while paused

        public init(speed: Int, unit: String, distance: String, distUnit: String, top: Int, limit: Int,
                    over: Bool, paused: Bool, rideSince: Date, rideSeconds: Int) {
            self.speed = speed; self.unit = unit; self.distance = distance; self.distUnit = distUnit
            self.top = top; self.limit = limit; self.over = over; self.paused = paused
            self.rideSince = rideSince; self.rideSeconds = rideSeconds
        }
    }
    public var name: String
    public init(name: String) { self.name = name }
}
#endif
