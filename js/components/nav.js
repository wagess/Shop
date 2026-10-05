/**
 * Nav principale — Sigma Design System (ac-nav)
 * Markup partagé et identique sur TOUTES les pages du site (fond clair,
 * texte toujours foncé — pas de variante sombre/transparente superposée
 * à une photo, pour éviter les problèmes de contraste selon le contenu photo).
 * Styles : assets/styles/components/nav.css
 * Figma : node 43:235 (vDYe0oWfzs4InGstvpCxBk) — 2026-09-21.
 *
 * @returns {HTMLElement}
 */
// Icônes exactes exportées du Figma (node 43:235) — une icône distincte par
// lien, pas un chevron "dropdown" générique répété (voir nav-icon-*.svg).
const ICONS = {
  stories:     '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.99967 5.75C12.1096 5.75 13.8616 7.28849 14.193 9.30469L14.2878 9.87598L14.8639 9.92969C16.3886 10.0709 17.5837 11.355 17.5837 12.917C17.5835 14.5736 16.2403 15.9168 14.5837 15.917H5.41667C3.75992 15.917 2.41684 14.5737 2.41667 12.917C2.41667 11.3551 3.61082 10.071 5.13542 9.92969L5.71257 9.87598L5.80632 9.30469C6.13775 7.28859 7.88989 5.75016 9.99967 5.75Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  // Pas de correspondant Figma (node 43:235 n'a que 4 liens) — "Séries" est
  // un ajout produit du 2026-09-22, icône "couches" choisie pour rester
  // cohérente avec le style des autres (trait, currentColor).
  series:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  sagas:       '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.62512 17.3408L11.9582 11.8259C12.0372 11.7254 12.158 11.6667 12.2858 11.6667H15.7434C16.3475 11.6667 16.9562 11.5215 17.4343 11.1522C18.4941 10.3337 18.4941 9.66632 17.4343 8.84778C16.9562 8.47848 16.3475 8.33333 15.7434 8.33333H12.2858C12.158 8.33333 12.0372 8.27463 11.9582 8.17409L7.62512 2.65924C7.54612 2.5587 7.42534 2.5 7.29749 2.5H5.67418C5.36444 2.5 5.16298 2.82596 5.3015 3.10301L7.64943 7.79886C7.77908 8.05816 7.61089 8.36731 7.32277 8.39932L4.50145 8.7128C4.30617 8.7345 4.12228 8.61684 4.06015 8.43045L3.4283 6.5349C3.37159 6.36476 3.21236 6.25 3.03302 6.25H2.08333C1.85321 6.25 1.66667 6.43655 1.66667 6.66667V13.3333C1.66667 13.5635 1.85321 13.75 2.08333 13.75H3.03302C3.21236 13.75 3.37159 13.6352 3.4283 13.4651L4.06015 11.5696C4.12228 11.3832 4.30617 11.2655 4.50145 11.2872L7.32277 11.6007C7.61089 11.6327 7.77908 11.9418 7.64943 12.2011L5.3015 16.897C5.16298 17.174 5.36444 17.5 5.67418 17.5H7.29749C7.42534 17.5 7.54612 17.4413 7.62512 17.3408Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  phototheque: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 6.875C8.27415 6.875 6.87504 8.27411 6.87504 10C6.87504 11.7259 8.27415 13.125 10 13.125C11.7259 13.125 13.125 11.7259 13.125 10C13.125 8.27411 11.7259 6.875 10 6.875ZM8.12504 10C8.12504 8.96447 8.96451 8.125 10 8.125C11.0356 8.125 11.875 8.96447 11.875 10C11.875 11.0355 11.0356 11.875 10 11.875C8.96451 11.875 8.12504 11.0355 8.12504 10Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10 4.375C7.96005 4.375 6.11662 5.26768 4.67694 6.2781C3.2316 7.29249 2.13755 8.46454 1.58318 9.11262C1.14334 9.62682 1.14334 10.3732 1.58318 10.8874C2.13755 11.5355 3.2316 12.7075 4.67694 13.7219C6.11662 14.7323 7.96005 15.625 10 15.625C12.0399 15.625 13.8834 14.7323 15.3231 13.7219C16.7684 12.7075 17.8625 11.5355 18.4168 10.8874C18.8567 10.3732 18.8567 9.62682 18.4168 9.11262C17.8625 8.46454 16.7684 7.29249 15.3231 6.2781C13.8834 5.26768 12.0399 4.375 10 4.375ZM2.53307 9.92516C3.05026 9.32053 4.06726 8.23314 5.39503 7.30126C6.72845 6.36541 8.32017 5.625 10 5.625C11.6798 5.625 13.2716 6.36541 14.605 7.30126C15.9327 8.23314 16.9497 9.32053 17.4669 9.92515C17.4893 9.95128 17.4967 9.97742 17.4967 10C17.4967 10.0226 17.4893 10.0487 17.4669 10.0748C16.9497 10.6795 15.9327 11.7669 14.605 12.6987C13.2716 13.6346 11.6798 14.375 10 14.375C8.32017 14.375 6.72845 13.6346 5.39503 12.6987C4.06726 11.7669 3.05026 10.6795 2.53307 10.0748C2.51072 10.0487 2.5033 10.0226 2.5033 10C2.5033 9.97742 2.51072 9.95128 2.53307 9.92516Z" fill="currentColor"/></svg>',
  apropos:     '<svg width="18" height="18" viewBox="0 0 17.9167 17.9167" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.79167 13.125C9.79167 13.5852 9.41857 13.9583 8.95833 13.9583C8.4981 13.9583 8.125 13.5852 8.125 13.125C8.125 12.6648 8.4981 12.2917 8.95833 12.2917C9.41857 12.2917 9.79167 12.6648 9.79167 13.125Z" fill="currentColor"/><path d="M8.67869 5.40097C9.19463 5.28504 9.70556 5.30951 10.0957 5.46834C10.4631 5.61788 10.7379 5.88794 10.852 6.34445C10.9458 6.71973 10.8183 7.14917 10.518 7.58789C10.2211 8.02184 9.82152 8.3629 9.58369 8.51006L9.57417 8.51595C9.50121 8.56104 9.38711 8.63156 9.27983 8.72261C8.89 9.05344 8.60403 9.36484 8.45798 9.79002C8.33256 10.1551 8.33292 10.5584 8.33329 10.9736L8.33333 11.0413C8.33333 11.3864 8.61316 11.6663 8.95833 11.6663C9.30351 11.6663 9.58333 11.3864 9.58333 11.0413C9.58333 10.5251 9.59091 10.3395 9.64017 10.1961C9.67559 10.093 9.75258 9.96087 10.0887 9.67566C10.1176 9.65109 10.1564 9.62563 10.2414 9.57302C10.6212 9.338 11.1503 8.87737 11.5496 8.29385C11.9457 7.71511 12.2822 6.91131 12.0647 6.04128C11.8455 5.16446 11.2704 4.59694 10.567 4.3106C9.88646 4.03355 9.10572 4.02385 8.40464 4.18139C6.90646 4.51804 5.83333 5.72192 5.83333 7.29118C5.83333 7.63636 6.11316 7.91618 6.45833 7.91618C6.80351 7.91618 7.08333 7.63636 7.08333 7.29118C7.08333 6.36043 7.6969 5.62159 8.67869 5.40097Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4.47035e-08 8.95833C4.47035e-08 4.01078 4.01078 0 8.95833 0C13.9059 0 17.9167 4.01078 17.9167 8.95833C17.9167 13.9059 13.9059 17.9167 8.95833 17.9167C4.01078 17.9167 4.47035e-08 13.9059 4.47035e-08 8.95833ZM8.95833 1.25C4.70114 1.25 1.25 4.70114 1.25 8.95833C1.25 13.2155 4.70114 16.6667 8.95833 16.6667C13.2155 16.6667 16.6667 13.2155 16.6667 8.95833C16.6667 4.70114 13.2155 1.25 8.95833 1.25Z" fill="currentColor"/></svg>',
};

export function createNav() {
  const nav = document.createElement('nav');
  nav.className = 'ac-nav py-6 px-6 lg:px-13';

  const currentPath = location.pathname;
  const links = [
    { label: 'Stories',     href: '/stories/',        icon: ICONS.stories },
    { label: 'Séries',      href: '/series.html',      icon: ICONS.series },
    { label: 'Sagas',       href: '/sagas.html',       icon: ICONS.sagas },
    { label: 'Photothèque', href: '/phototheque.html', icon: ICONS.phototheque },
    { label: 'À propos',    href: '/a-propos.html',    icon: ICONS.apropos },
  ];

  const linksHtml = links.map(({ label, href, icon }) => {
    const current = href === currentPath ? ' aria-current="page"' : '';
    return `<a href="${href}" class="ac-nav__link gap-1"${current}><span>${label}</span>${icon}</a>`;
  }).join('');

  nav.innerHTML = `
    <a href="/" class="ac-nav__brand"><img class="ac-nav__logo" src="/assets/svg/Stéphane Wagner.svg" alt="Stéphane Wagner"></a>
    <div class="ac-nav__links gap-8">${linksHtml}</div>
    <div class="ac-nav__actions gap-3">
      <a href="/rejoindre/" class="ac-nav__newsletter">Infolettre</a>
    </div>
  `;

  return nav;
}
