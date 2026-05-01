import Foundation
import UserNotifications

class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    private let config: NotifierConfig
    private var timeoutWork: DispatchWorkItem?
    private let categoryIdentifier = "CLAUDE_NOTIFIER_CATEGORY"

    init(config: NotifierConfig) {
        self.config = config
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func requestPermissionAndSend() {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            DispatchQueue.main.async {
                self.sendNotification()
            }
        }
    }

    private func sendNotification() {
        let center = UNUserNotificationCenter.current()
        let content = UNMutableNotificationContent()

        content.title = config.title
        content.body = config.message

        if let subtitle = config.subtitle {
            content.subtitle = subtitle
        }

        if let sound = config.sound {
            if sound == "default" {
                content.sound = .default
            } else {
                content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: sound))
            }
        }

        if let group = config.group {
            content.threadIdentifier = group
        }

        // Register category with actions
        if let actionNames = config.actions, !actionNames.isEmpty {
            var notificationActions: [UNNotificationAction] = []
            for name in actionNames {
                let action = UNNotificationAction(
                    identifier: name,
                    title: name,
                    options: .foreground
                )
                notificationActions.append(action)
            }

            let category = UNNotificationCategory(
                identifier: categoryIdentifier,
                actions: notificationActions,
                intentIdentifiers: [],
                options: .customDismissAction
            )
            center.setNotificationCategories([category])
            content.categoryIdentifier = categoryIdentifier
        } else {
            // Even without actions, register category for dismiss detection
            let category = UNNotificationCategory(
                identifier: categoryIdentifier,
                actions: [],
                intentIdentifiers: [],
                options: .customDismissAction
            )
            center.setNotificationCategories([category])
            content.categoryIdentifier = categoryIdentifier
        }

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        center.add(request) { error in
            if let error = error {
                fputs("Notification error: \(error.localizedDescription)\n", stderr)
                exit(0)
            }
            self.startTimeout()
        }
    }

    private func startTimeout() {
        guard let timeout = config.timeout, timeout > 0 else { return }

        let work = DispatchWorkItem {
            print("@TIMEOUT")
            fflush(stdout)
            exit(0)
        }
        self.timeoutWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(timeout), execute: work)
    }

    // Called when user interacts with notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        timeoutWork?.cancel()

        switch response.actionIdentifier {
        case UNNotificationDismissActionIdentifier:
            print("@CLOSED")
        case UNNotificationDefaultActionIdentifier:
            print("@CONTENTCLICKED")
        default:
            // Custom action — print the action identifier (which equals the title)
            print(response.actionIdentifier)
        }

        fflush(stdout)
        completionHandler()
        exit(0)
    }

    // Show notification even if app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
}
