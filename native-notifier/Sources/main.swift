import Foundation
import UserNotifications

guard let config = CLIParser.parse() else {
    exit(0)
}

let manager = NotificationManager(config: config)
manager.requestPermissionAndSend()

RunLoop.current.run()
