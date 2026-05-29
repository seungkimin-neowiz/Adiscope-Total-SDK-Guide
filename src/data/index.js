import android from './android.json'
import ios from './ios.json'
import unity from './unity.json'
import flutter from './flutter.json'

export const platforms = [android, ios, unity, flutter]
export const platformMap = Object.fromEntries(platforms.map(p => [p.id, p]))
