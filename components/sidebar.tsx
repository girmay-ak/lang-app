import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const groups = [
  { name: "Spanish Learners", icon: "🇪🇸" },
  { name: "French Community", icon: "🇫🇷" },
]

const friends = [
  { name: "Eleanor Pena", status: "offline", time: "11 min", avatar: "/woman1.png" },
  { name: "Leslie Alexander", status: "online", avatar: "/diverse-woman-portrait.png" },
  { name: "Brooklyn Simmons", status: "online", avatar: "/diverse-group-women.png" },
  { name: "Arlene McCoy", status: "offline", time: "11 min", avatar: "/diverse-group-women.png" },
  { name: "Jerome Bell", status: "offline", time: "9 min", avatar: "/thoughtful-man.png" },
  { name: "Darlene Robertson", status: "online", avatar: "/woman5.png" },
  { name: "Kathryn Murphy", status: "online", avatar: "/woman6.png" },
  { name: "Theresa Webb", status: "offline", time: "11 min", avatar: "/woman7.png" },
  { name: "Darrell Steward", status: "online", avatar: "/diverse-group-friends.png" },
]

export function Sidebar() {
  return (
    <aside className="w-72 border-r bg-card px-4 py-6 overflow-y-auto h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Groups Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Your Groups
          </h3>
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.name} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                <div className="text-2xl">{group.icon}</div>
                <span className="text-sm font-medium">{group.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Friends Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Language Partners
          </h3>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{friend.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {friend.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{friend.name}</span>
                </div>
                {friend.time && (
                  <span className="text-xs text-muted-foreground">{friend.time}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
