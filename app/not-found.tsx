import Link from 'next/link';
export default function NotFound() { return <main className="flow-page"><div className="flow-heading"><h1>This link took a wrong turn.</h1><p>Try the full claim link, or start from home.</p></div><div className="center"><Link href="/" className="button">Back to Luma</Link></div></main>; }
