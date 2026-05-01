import Foundation

enum CLIParser {
    static func parse() -> NotifierConfig? {
        let args = CommandLine.arguments
        var title: String?
        var message: String?
        var subtitle: String?
        var sound: String?
        var group: String?
        var timeout: Int?
        var closeLabel: String?
        var actions: [String]?
        var dropdownLabel: String?

        var i = 1
        while i < args.count {
            let flag = args[i]
            i += 1
            guard i < args.count else { break }
            let value = args[i]
            i += 1

            switch flag {
            case "--title":
                title = value
            case "--message":
                message = value
            case "--subtitle":
                subtitle = value
            case "--sound":
                sound = value
            case "--group":
                group = value
            case "--timeout":
                timeout = Int(value)
            case "--close-label":
                closeLabel = value
            case "--actions":
                actions = value.components(separatedBy: ",")
            case "--dropdown-label":
                dropdownLabel = value
            default:
                break
            }
        }

        guard let t = title, let m = message else {
            fputs("Usage: claude-notifier --title <title> --message <message> [options]\n", stderr)
            return nil
        }

        return NotifierConfig(
            title: t,
            message: m,
            subtitle: subtitle,
            sound: sound,
            group: group,
            timeout: timeout,
            closeLabel: closeLabel,
            actions: actions,
            dropdownLabel: dropdownLabel
        )
    }
}
