import Foundation

struct NotifierConfig {
    let title: String
    let message: String
    var subtitle: String?
    var sound: String?
    var group: String?
    var timeout: Int?
    var closeLabel: String?
    var actions: [String]?
    var dropdownLabel: String?
}
