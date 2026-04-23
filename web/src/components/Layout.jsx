// // import { NavLink } from 'react-router-dom';
// // import { Outlet } from 'react-router-dom';
// // import { useSessionStore } from '../../../shared/store/sessionStore.js';
// // import styles from './Layout.module.css';

// // export default function Layout() {
// //   const ghostScore = useSessionStore(s => s.ghostScore);

// //   return (
// //     <div className={styles.shell}>
// //       <header className={styles.header}>
// //         <div className={styles.headerLeft}>
// //           <div className={styles.avatar}>
// //             <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
// //           </div>
// //           <span className={styles.logo}>ChitChat</span>
// //         </div>
// //         <NavLink to="/ghost" className={styles.ghostPill}>
// //           <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>stars</span>
// //           {ghostScore}
// //         </NavLink>
// //       </header>

// //       <main className={styles.main}>
// //         <Outlet />
// //       </main>

// //       <nav className={styles.nav}>
// //         <NavLink to="/" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
// //           <span className="material-symbols-outlined">explore</span>
// //         </NavLink>
// //         <NavLink to="/groups/new" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
// //           <span className="material-symbols-outlined">add</span>
// //         </NavLink>
// //         <NavLink to="/places" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
// //           <span className="material-symbols-outlined">location_on</span>
// //         </NavLink>
// //         <NavLink to="/ghost" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
// //           <span className="material-symbols-outlined">visibility_off</span>
// //         </NavLink>
// //       </nav>
// //     </div>
// //   );
// // }


// import { NavLink, useNavigate } from 'react-router-dom';
// import { Outlet } from 'react-router-dom';
// import { useSessionStore } from '../../../shared/store/sessionStore.js';
// import styles from './Layout.module.css';

// export default function Layout() {
//   const ghostScore = useSessionStore(s => s.ghostScore);
//   const logout     = useSessionStore(s => s.logout);
//   const user       = useSessionStore(s => s.user);
//   const navigate   = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/auth');
//   };

//   return (
//     <div className={styles.shell}>
//       <header className={styles.header}>
//         <div className={styles.headerLeft}>
//           <div className={styles.avatar}>
//             <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
//           </div>
//           <span className={styles.logo}>ChitChat</span>
//           {user?.name && <span className={styles.userName}>{user.name}</span>}
//         </div>

//         <div className={styles.headerRight}>
//           <NavLink to="/ghost" className={styles.ghostPill}>
//             <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>stars</span>
//             {ghostScore}
//           </NavLink>
//           <button className={styles.logoutBtn} onClick={handleLogout}>
//             <span className="material-symbols-outlined">logout</span>
//           </button>
//         </div>
//       </header>

//       <main className={styles.main}>
//         <Outlet />
//       </main>

//       <nav className={styles.nav}>
//         <NavLink to="/" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
//           <span className="material-symbols-outlined">explore</span>
//         </NavLink>
//         <NavLink to="/groups/new" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
//           <span className="material-symbols-outlined">add</span>
//         </NavLink>
//         <NavLink to="/places" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
//           <span className="material-symbols-outlined">location_on</span>
//         </NavLink>
//         <NavLink to="/ghost" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
//           <span className="material-symbols-outlined">visibility_off</span>
//         </NavLink>
//       </nav>
//     </div>
//   );
// }

import { NavLink, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useSessionStore } from '../../../shared/store/sessionStore.js';
import { useState, useEffect } from 'react';
import styles from './Layout.module.css';

export default function Layout() {
  const ghostScore = useSessionStore(s => s.ghostScore);
  const logout = useSessionStore(s => s.logout);
  const user = useSessionStore(s => s.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>
            <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.id || 'default'}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'var(--bg6)' }} />
          </div>
          {/* <img src="/logo.png" alt="Logo" style={{ height: '50px', marginLeft: '-30px' }} /> */}
        </div>

        <div className={styles.headerRight}>
          <button className={styles.logoutBtn} onClick={toggleTheme} title="Toggle Theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <NavLink to="/ghost" className={styles.ghostPill}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>stars</span>
            {ghostScore}
          </NavLink>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <span className="material-symbols-outlined">explore</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <span className="material-symbols-outlined">travel_explore</span>
        </NavLink>
        <NavLink to="/groups/new" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <span className="material-symbols-outlined">add</span>
        </NavLink>

        <NavLink to="/places" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <span className="material-symbols-outlined">location_on</span>
        </NavLink>
        <NavLink to="/ghost" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>
          <span className="material-symbols-outlined">visibility_off</span>
        </NavLink>
      </nav>
    </div>
  );
}