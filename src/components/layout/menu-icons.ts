import {
	Backpack,
	Bike,
	Binoculars,
	BookOpen,
	BrickWall,
	Building2,
	Camera,
	Compass,
	CreditCard,
	createLucideIcon,
	FileCheck2,
	Footprints,
	Globe,
	HeartHandshake,
	Landmark,
	Leaf,
	LockKeyhole,
	type LucideIcon,
	Map as MapIcon,
	MapPinned,
	Mountain,
	MountainSnow,
	Phone,
	Route,
	Sailboat,
	ShieldCheck,
	Ship,
	Sparkles,
	Sprout,
	Stars,
	Sun,
	Tent,
	Trees,
	Users,
	Waves,
	Wine,
} from "lucide-react";
import type { Link } from "@/types/global";

const Volcano = createLucideIcon("Volcano", [
	[
		"path",
		{
			d: "M2 21 9 8h6l7 13H2ZM9 8l3 4 3-4M10 4l-1-2m5 2 1-2M12 6V2",
			key: "volcano",
		},
	],
]);
const MachuPicchu = createLucideIcon("MachuPicchu", [
	[
		"path",
		{
			d: "m2 14 5-8 3 4 4-8 5 12M2 21h20M4 18h16M6 15h12M9 15v-4h5v4m-3 0v-2",
			key: "citadel",
		},
	],
]);
const Penguin = createLucideIcon("Penguin", [
	[
		"path",
		{
			d: "M7 10V7a5 5 0 0 1 10 0v3c1 3 2 5 1 8-1 4-11 4-12 0-1-3 0-5 1-8Zm0 1-4 5m14-5 4 5M8 21l-2 1m10-1 2 1m-8-13 2 2 2-2",
			key: "body",
		},
	],
	["path", { d: "M9 6h.01M15 6h.01M9 17c0-6 6-6 6 0", key: "details" }],
]);
const Parrot = createLucideIcon("Parrot", [
	[
		"path",
		{
			d: "M9 19 6 23l1-9V7a5 5 0 0 1 10 0v2h-4V7m4-2c3 0 4 2 4 4h-4M8 10c7-4 10 7 3 8H7m4 0v3m-6 0h12",
			key: "parrot",
		},
	],
	["circle", { cx: "13", cy: "5", r: ".5", key: "eye" }],
]);
const Llama = createLucideIcon("Llama", [
	[
		"path",
		{
			d: "M5 13h8V6l2-2V1l2 3h3v5h-3v8l-2 2v3h-2v-5H7v5H5v-5l-2-2v-4m4 2v2h5v-2",
			key: "llama",
		},
	],
	["path", { d: "M17 6h.01", key: "eye" }],
]);
const Hiker = createLucideIcon("Hiker", [
	["circle", { cx: "13", cy: "3", r: "2", key: "head" }],
	[
		"path",
		{
			d: "m10 8 3-1 2 4 3 1m-8-4-2 6 5 2 1 6m-6-8-3 7m7-13-2 6m9-5-2 13M7 7l-2 5 3 1",
			key: "hiker",
		},
	],
]);

// Specific destinations precede broad words like "tour" or "Machu Picchu".
const rules: [RegExp, LucideIcon[]][] = [
	[/jungle|bicicl/, [Bike, Route]],
	[/lares|huchuy/, [Llama, Footprints]],
	[/salkantay/, [MountainSnow, Tent, Backpack]],
	[/choquequirao/, [Landmark, BrickWall]],
	[/rainbow|colores|colorida|arco.?iris/, [Sparkles, Mountain]],
	[/ausangate/, [Mountain, Tent, MountainSnow]],
	[
		/short inca|inca.*2 (?:days|dias)|inca corto|inca curto/,
		[Footprints, Hiker],
	],
	[/inca trail|camino inca|caminho inca|trilha inca/, [Hiker, Backpack, Route]],
	[/humantay|lagoon|laguna|lagoa/, [Waves, Sailboat]],
	[/nazca/, [Compass, MapIcon]],
	[/paracas/, [Sailboat, Ship]],
	[/arequipa|arquipa|tunupa|volcan/, [Volcano, MountainSnow]],
	[/puno|titicaca/, [Ship, Waves, Sailboat]],
	[/\bica\b/, [Penguin, Sun]],
	[/iquitos/, [Parrot, Leaf]],
	[/maldonado|amazon/, [Trees, Sprout, Leaf]],
	[/cusco|cuzco|machu/, [MachuPicchu, Camera, Landmark]],
	[/lima/, [Building2, Landmark]],
	[/geyser|geiser|tatio/, [Sprout, Waves]],
	[/astronom|stars|estrellas/, [Stars, Sparkles]],
	[/moon|luna|lua/, [Mountain, Compass]],
	[/uyuni|salar|salt/, [Waves, Sun, Mountain]],
	[/wine|vino|vinho|tarija/, [Wine, Leaf]],
	[/atacama|desert/, [Sun, Mountain]],
	[/payment|pago|pagamento/, [CreditCard]],
	[/esnna/, [ShieldCheck]],
	[/data|datos|dados/, [LockKeyhole]],
	[/polic|politic/, [FileCheck2, BookOpen]],
	[/client/, [HeartHandshake, Users]],
	[/contact/, [Phone]],
	[/about|nosotros|sobre/, [Users, BookOpen]],
];

export function getMenuIcons(links: Link[]): LucideIcon[] {
	const used = new Set<LucideIcon>();
	return links.map((link) => {
		const text = link.label
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase();
		const candidates = rules
			.filter(([pattern]) => pattern.test(text))
			.flatMap(([, icons]) => icons);
		const options = [
			...candidates,
			Route,
			Globe,
			MapIcon,
			MapPinned,
			Compass,
			Binoculars,
			Backpack,
			Camera,
			Tent,
		];
		const icon =
			options.find((candidate) => !used.has(candidate)) ?? options[0];
		used.add(icon);
		return icon;
	});
}
