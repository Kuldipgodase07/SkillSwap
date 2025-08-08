declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const Menu: FC<IconProps>;
  export const X: FC<IconProps>;
  export const LogOut: FC<IconProps>;
  export const BookOpen: FC<IconProps>;
  export const Shield: FC<IconProps>;
  export const AlertCircle: FC<IconProps>;
  export const Video: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const ExternalLink: FC<IconProps>;
  export const Play: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const XCircle: FC<IconProps>;
  export const Phone: FC<IconProps>;
  export const Check: FC<IconProps>;
  export const Star: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const Eye: FC<IconProps>;
  export const Edit: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const Activity: FC<IconProps>;
  export const AlertTriangle: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const TrendingUp: FC<IconProps>;
  export const UserPlus: FC<IconProps>;
  export const ArrowRight: FC<IconProps>;
  export const Code: FC<IconProps>;
  export const Camera: FC<IconProps>;
  export const Palette: FC<IconProps>;
  export const Music: FC<IconProps>;
  export const EyeOff: FC<IconProps>;
  export const Send: FC<IconProps>;
  export const User: FC<IconProps>;
  export const Save: FC<IconProps>;
  export const MapPin: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const HardDrive: FC<IconProps>;
  export const Flag: FC<IconProps>;
  export const Heart: FC<IconProps>;
  export const MessageCircle: FC<IconProps>;
  export const Award: FC<IconProps>;
  export const Zap: FC<IconProps>;
  export const Globe: FC<IconProps>;
  export const Database: FC<IconProps>;
  export const BarChart3: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Crown: FC<IconProps>;
  export const UserCheck: FC<IconProps>;
  export const UserX: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const ChevronUp: FC<IconProps>;
  export const FileText: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Sliders: FC<IconProps>;
  export const Download: FC<IconProps>;
  export const Ban: FC<IconProps>;
  export const Unlock: FC<IconProps>;
  export const Key: FC<IconProps>;
  export const MoreVertical: FC<IconProps>;
  export const VolumeX: FC<IconProps>;
  export const Volume2: FC<IconProps>;
  export const Tag: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const TrendingUp: FC<IconProps>;
  export const Eye: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const Star: FC<IconProps>;
  export const Heart: FC<IconProps>;
  export const Shield: FC<IconProps>;
  export const Mic: FC<IconProps>;
  export const MicOff: FC<IconProps>;
  export const VideoOff: FC<IconProps>;
  export const PhoneOff: FC<IconProps>;
  export const Monitor: FC<IconProps>;
}

declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export function onAuthStateChanged(auth: any, callback: (user: any) => void): () => void;
  export function updateProfile(user: any, profile: any): Promise<void>;
  export type User = any;
}

declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function collection(db: any, path: string): any;
  export function doc(db: any, path: string, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function addDoc(collectionRef: any, data: any): Promise<any>;
  export function updateDoc(docRef: any, data: any): Promise<void>;
  export function setDoc(docRef: any, data: any): Promise<void>;
  export function deleteDoc(docRef: any): Promise<void>;
  export function query(collectionRef: any, ...constraints: any[]): any;
  export function where(field: string, op: string, value: any): any;
  export function orderBy(field: string, direction?: string): any;
  export function limit(count: number): any;
  export function onSnapshot(query: any, callback: (snapshot: any) => void): () => void;
  export function writeBatch(db: any): any;
  export function serverTimestamp(): any;
  export const Timestamp: any;
}

declare module 'firebase/storage' {
  export function getStorage(app?: any): any;
}
