/**
 * Interfaces para el singleType Global de Strapi (header, topbar, menu).
 */

import type { Link, Logo, Imagen } from "./common";

// Re-exportar tipos comunes para retrocompatibilidad
export type { Imagen, Link, Logo, StrapiResponse } from "./common";

export interface TopBar {
	id: number;
	isVisible: boolean;
	text: string;
	link: Link;
}

export interface HeaderTop {
	id: number;
	logo: Logo;
	headerLink: Link[];
	button: Link[];
}

export interface MenuItem {
	id: number;
	link: Link;
	item: Link[];
}

export interface Menu {
	id: number;
	menuItems: MenuItem[];
}

export interface Destination {
	id: number;
	titulo: string;
	link: Link[];
}

export interface DreamyAbout {
	id: number;
	titulo: string;
	link: Link[];
}

export interface Contact {
	id: number;
	titulo: string;
	link: Link[];
}

export interface Footer {
	id: number;
	logo: Logo;
	content: string;
	socialTitle: string;
	socialLogo: Logo[];
	destination: Destination;
	dreamyAbout: DreamyAbout;
	contact: Contact;
}

export interface Global {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	locale: string;
	topBar: TopBar;
	headerTop: HeaderTop;
	menu: Menu;
	footer: Footer;
}
