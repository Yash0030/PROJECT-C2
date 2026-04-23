import React from 'react';
import styles from './DownloadPage.module.css';

export default function DownloadPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Get ChitChat for your device</h1>
        <p className={styles.subtitle}>
          Download our native applications for the best experience across all your devices.
        </p>

        <div className={styles.buttons}>
          <a href="#" className={styles.downloadButton} onClick={(e) => alert("Android APK will be available soon after PWABuilder generation!")}>
            <span className={styles.icon}>🤖</span>
            <div className={styles.btnText}>
              <span className={styles.small}>Download for</span>
              <span className={styles.large}>Android</span>
            </div>
          </a>

          <a href="#" className={styles.downloadButton} onClick={(e) => alert("Windows MSIX will be available soon after PWABuilder generation!")}>
            <span className={styles.icon}>🪟</span>
            <div className={styles.btnText}>
              <span className={styles.small}>Download for</span>
              <span className={styles.large}>Windows</span>
            </div>
          </a>
        </div>
        
        <div className={styles.iosInstruction}>
          <p><strong>iOS Users:</strong> Open this website in Safari, tap the Share icon, and select "Add to Home Screen".</p>
        </div>
      </div>
    </div>
  );
}
