// Mobile sidebar
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobile-overlay');
const sidebarClose = document.getElementById('sidebar-close');

function openSidebar() {
  sidebar.classList.remove('-translate-x-full');
  mobileOverlay.classList.remove('hidden');
}
function closeSidebar() {
  sidebar.classList.add('-translate-x-full');
  mobileOverlay.classList.add('hidden');
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

// Dark mode toggle (both desktop and mobile)
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

document.querySelectorAll('.mobile-theme-toggle, .switcher-theme-toggle').forEach(btn => {
  btn.addEventListener('click', toggleTheme);
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

// Website switcher
const switcherItems = document.getElementById('switcher-items');
const panelItems = document.getElementById('switcher-panel-items');
if (switcherItems && panelItems) {
  panelItems.innerHTML = switcherItems.innerHTML;
  // Re-bind theme toggles in cloned content
  panelItems.querySelectorAll('.switcher-theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

const switcherBtn = document.getElementById('website-switcher-btn');
const switcherDropdown = document.getElementById('website-switcher-dropdown');
const switcherChevron = document.getElementById('website-switcher-chevron');
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarSwitcher = document.getElementById('sidebar-switcher');
const switcherBack = document.getElementById('switcher-back');

function openSwitcherPanel() {
  sidebarNav.classList.add('-translate-x-full');
  sidebarSwitcher.classList.remove('translate-x-full');
}

function closeSwitcherPanel() {
  sidebarNav.classList.remove('-translate-x-full');
  sidebarSwitcher.classList.add('translate-x-full');
}

if (switcherBtn) {
  switcherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth < 768) {
      openSwitcherPanel();
    } else {
      switcherDropdown.classList.toggle('hidden');
      switcherChevron.classList.toggle('rotate-180');
    }
  });
}

if (switcherBack) {
  switcherBack.addEventListener('click', closeSwitcherPanel);
}

// Reset switcher panel when sidebar closes
if (sidebarClose) sidebarClose.addEventListener('click', closeSwitcherPanel);
if (mobileOverlay) mobileOverlay.addEventListener('click', closeSwitcherPanel);

// Close desktop switcher dropdown on outside click
document.addEventListener('click', () => {
  if (switcherDropdown && !switcherDropdown.classList.contains('hidden')) {
    switcherDropdown.classList.add('hidden');
    switcherChevron.classList.remove('rotate-180');
  }
});
