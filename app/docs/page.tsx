import { LumaDocsContent } from '@/components/LumaDocsContent';
import { LumaDocsShell } from '@/components/LumaDocsShell';
import './docs.css';
export const metadata = { title: 'Documentation' };
export default function Docs() {
 return <LumaDocsShell><LumaDocsContent /></LumaDocsShell>;
}
