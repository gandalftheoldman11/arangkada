import ActivityKit
import SwiftUI
import WidgetKit

@main
struct ArangkadaWidgetBundle: WidgetBundle {
    var body: some Widget {
        ArangkadaLiveActivity()
    }
}

private let amber = Color(red: 0.961, green: 0.647, blue: 0.141)     // #F5A524
private let alarm = Color(red: 1.0, green: 0.353, blue: 0.278)       // #FF5A47
private let graphite = Color(red: 0.082, green: 0.106, blue: 0.137)  // #151B23

/// Ride time: ticks by itself while riding, fixed while paused.
private struct RideTime: View {
    let state: ArangkadaActivityAttributes.ContentState
    var body: some View {
        if state.paused {
            Text(format(state.rideSeconds))
        } else {
            Text(state.rideSince, style: .timer)
        }
    }
    private func format(_ s: Int) -> String {
        let h = s / 3600, m = (s % 3600) / 60, sec = s % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec) : String(format: "%d:%02d", m, sec)
    }
}

private struct Stat: View {
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value).font(.system(size: 17, weight: .bold, design: .rounded)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
            Text(label).font(.caption2).opacity(0.7).lineLimit(1)
        }
    }
}

struct LockScreenView: View {
    let context: ActivityViewContext<ArangkadaActivityAttributes>
    var body: some View {
        let s = context.state
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "gauge.with.dots.needle.67percent").foregroundColor(amber)
                Text(s.paused ? "Arangkada · Paused" : "Arangkada").font(.subheadline.weight(.semibold))
                Spacer()
                if context.isStale { Text("Open Arangkada").font(.caption.weight(.semibold)).foregroundColor(amber) }
                else if s.over { Text("Slow down").font(.caption.weight(.bold)).foregroundColor(alarm) }
                else { Circle().fill(s.paused ? amber : alarm).frame(width: 8, height: 8) }
            }
            HStack(alignment: .firstTextBaseline, spacing: 5) {
                Text("\(s.speed)").font(.system(size: 52, weight: .heavy, design: .rounded)).monospacedDigit()
                    .foregroundColor(s.over ? alarm : .white).lineLimit(1).minimumScaleFactor(0.6)
                Text(s.unit).font(.headline).opacity(0.75)
                Spacer(minLength: 8)
                RideTime(state: s).font(.system(size: 22, weight: .bold, design: .rounded)).monospacedDigit()
                    .multilineTextAlignment(.trailing).frame(maxWidth: 110, alignment: .trailing)
            }
            HStack(spacing: 20) {
                Stat(value: s.distance + " " + s.distUnit, label: "distance")
                Stat(value: "\(s.top)", label: "top " + s.unit)
                Stat(value: "\(s.limit)", label: "alert above")
                Spacer()
            }
        }
        .padding(16)
        .foregroundColor(.white)
    }
}

struct ArangkadaLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ArangkadaActivityAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(graphite)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(alignment: .firstTextBaseline, spacing: 3) {
                        Text("\(context.state.speed)").font(.system(size: 30, weight: .heavy, design: .rounded)).monospacedDigit()
                            .foregroundColor(context.state.over ? alarm : .white)
                        Text(context.state.unit).font(.caption)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    RideTime(state: context.state).font(.system(size: 20, weight: .bold, design: .rounded)).monospacedDigit()
                        .multilineTextAlignment(.trailing).frame(maxWidth: 90, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.distance + " " + context.state.distUnit)
                        Spacer()
                        Text(context.state.paused ? "Paused" : "Top \(context.state.top) " + context.state.unit)
                    }
                    .font(.subheadline)
                }
            } compactLeading: {
                Image(systemName: "gauge.with.dots.needle.67percent").foregroundColor(context.state.over ? alarm : amber)
            } compactTrailing: {
                Text("\(context.state.speed)").font(.caption.weight(.bold)).monospacedDigit()
                    .foregroundColor(context.state.over ? alarm : .white)
            } minimal: {
                Text("\(context.state.speed)").font(.caption2.weight(.bold)).monospacedDigit()
                    .foregroundColor(context.state.over ? alarm : amber)
            }
            .keylineTint(context.state.over ? alarm : amber)
        }
    }
}
