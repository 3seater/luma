import styles from './page.module.css';

export const metadata = { title: 'Logo & profile picture' };

export default function BrandPage() {
  return <main className={styles.page}>
    <div className={styles.layout}>
      <div className={styles.preview}>
        {/* SVG is intentionally shown at its natural square aspect ratio. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/luma-pfp-flat.svg" width="400" height="400" alt="Luma silver six-point logo on a navy-to-blue gradient" />
      </div>
      <div className={styles.copy}>
        <span className="eyebrow">LUMA BRAND ASSET</span>
        <h1>Your new signature.</h1>
        <p>A simple silver mark on midnight blue.<br />Entirely vector. Ready to make yours.</p>
        <a href="/brand/luma-pfp-flat.svg" download="luma-pfp.svg" className={styles.primary}>Download SVG <span>↗</span></a>
        <a href="/brand/luma-pfp-flat.png" download="luma-pfp-1024.png" className={styles.secondary}>Download PNG <span>1024 × 1024</span></a>
        <a href="/brand/luma-mark-light.svg" download="luma-logo-transparent.svg" className={styles.textLink}>Logo only · transparent SVG ↗</a>
        <small>SVG opens in Figma, Illustrator, or any browser.<br />PNG is ready to upload as your profile picture.</small>
      </div>
    </div>
  </main>;
}
