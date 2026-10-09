import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	rgb,
	StandardFonts,
} from "pdf-lib/dist/pdf-lib.esm.js";
import { countries } from "../data/countries";
import { DREAMY_LOGO_PNG_BASE64 } from "./dreamyLogoPng";
import {
	MACHU_PICCHU_ROUTES,
	type MachuPicchuPrebooking,
} from "./machuPicchuPrebooking";
import { formatPrebookingDate } from "./prebookingPdf";

export interface MachuPicchuPdfData {
	request: MachuPicchuPrebooking;
	reference: string;
	createdAt: Date;
}
const W = 595.28,
	H = 841.89,
	M = 36,
	WIDTH = W - M * 2;
const palette = {
	green: rgb(0, 0.44, 0.125),
	ink: rgb(0.1, 0.15, 0.2),
	muted: rgb(0.4, 0.46, 0.49),
	line: rgb(0.86, 0.9, 0.88),
	light: rgb(0.95, 0.97, 0.95),
	red: rgb(0.718, 0.082, 0.196),
	rose: rgb(0.985, 0.935, 0.945),
	white: rgb(1, 1, 1),
};

export async function generateMachuPicchuPrebookingPdf({
	request,
	reference,
	createdAt,
}: MachuPicchuPdfData): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(`Pre-reserva Machu Picchu · ${reference}`);
	pdf.setAuthor("Dreamy Tours");
	pdf.setSubject(
		"Solicitud pendiente de revisión. No confirma disponibilidad ni pago.",
	);
	pdf.setCreationDate(createdAt);
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const logoImage = await pdf.embedPng(DREAMY_LOGO_PNG_BASE64);
	let page: PDFPage;
	let y = 0;
	const clean = (value: string, font = regular) =>
		Array.from(value.normalize("NFC").replace(/[\r\n\t]+/g, " "))
			.map((c) => {
				try {
					font.encodeText(c);
					return c;
				} catch {
					return "?";
				}
			})
			.join("");
	function lines(
		value: string,
		width: number,
		size: number,
		font: PDFFont = regular,
	): string[] {
		const result: string[] = [];
		let line = "";
		for (const word of clean(value, font).split(/\s+/).filter(Boolean)) {
			const candidate = line ? `${line} ${word}` : word;
			if (font.widthOfTextAtSize(candidate, size) <= width) {
				line = candidate;
				continue;
			}
			if (line) result.push(line);
			line = "";
			for (const character of word) {
				if (font.widthOfTextAtSize(line + character, size) > width && line) {
					result.push(line);
					line = "";
				}
				line += character;
			}
		}
		if (line) result.push(line);
		return result.length ? result : ["—"];
	}
	function text(
		value: string,
		x: number,
		top: number,
		size = 10,
		font = regular,
		color = palette.ink,
	) {
		page.drawText(clean(value, font), { x, y: top - size, size, font, color });
	}
	function box(
		x: number,
		top: number,
		width: number,
		height: number,
		color = palette.light,
	) {
		page.drawRectangle({ x, y: top - height, width, height, color });
	}
	function startPage(first = false) {
		page = pdf.addPage([W, H]);
		box(0, H, W, first ? 116 : 76, palette.red);
		const logoSize = logoImage.scaleToFit(108, 35);
		page.drawImage(logoImage, {
			x: M + 7,
			y: H - 27 - logoSize.height,
			...logoSize,
		});
		text("SOLICITUD DE PRE-RESERVA", M + 145, H - 26, 9, bold, palette.white);
		text(reference, M + 145, H - 44, 11, bold, palette.white);
		if (first) {
			text("Machu Picchu", M, H - 80, 23, bold, palette.white);
			text(
				"Una visita por confirmar. Un viaje por comenzar.",
				M + 190,
				H - 89,
				9,
				regular,
				palette.white,
			);
		}
		y = H - (first ? 134 : 94);
	}
	function ensure(height: number) {
		if (y - height < 58) startPage();
	}
	function section(number: string, label: string, required = 50) {
		ensure(required + 29);
		const color = number === "04" ? palette.red : palette.green;
		box(M, y, WIDTH, 24, color);
		box(
			M,
			y,
			31,
			24,
			number === "04" ? rgb(0.58, 0.06, 0.15) : rgb(0, 0.34, 0.1),
		);
		text(number, M + 8, y - 7, 10, bold, palette.white);
		text(label, M + 42, y - 6, 11, bold, palette.white);
		y -= 29;
	}
	function fields(entries: Array<[string, string]>, columns = 2) {
		const gap = 12,
			width = (WIDTH - gap * (columns - 1)) / columns;
		for (let i = 0; i < entries.length; i += columns) {
			const row = entries.slice(i, i + columns);
			const wrapped = row.map(([, value]) =>
				lines(value, width - 24, 10, bold),
			);
			const height = Math.max(
				49,
				31 + Math.max(...wrapped.map((v) => v.length)) * 13,
			);
			ensure(height + 8);
			row.forEach(([label], index) => {
				const x = M + index * (width + gap);
				box(x, y, width, height);
				text(label.toUpperCase(), x + 12, y - 9, 7, regular, palette.muted);
				wrapped[index].forEach((line, n) => {
					text(line, x + 12, y - 23 - n * 13, 10, bold);
				});
			});
			y -= height + 8;
		}
	}
	startPage(true);
	const createdLabel = new Intl.DateTimeFormat("es-PE", {
		timeZone: "America/Lima",
		dateStyle: "short",
		timeStyle: "short",
	}).format(createdAt);
	text(
		`Recibida: ${createdLabel} · Hora de Perú`,
		M,
		y,
		8,
		regular,
		palette.muted,
	);
	y -= 22;
	box(M, y, WIDTH, 48, palette.rose);
	text("PENDIENTE DE REVISIÓN", M + 12, y - 9, 9, bold, palette.red);
	text(
		"No bloquea cupos, no emite boletos y no acredita ningún pago.",
		M + 12,
		y - 26,
		9,
	);
	y -= 58;
	section("01", "Tu visita", 112);
	fields([
		["Fecha solicitada", formatPrebookingDate(request.selection.date)],
		["Horario solicitado", `${request.selection.time} h · Perú`],
		[
			"Circuito solicitado",
			`${MACHU_PICCHU_ROUTES[request.selection.route]} · Ruta ${request.selection.route}`,
		],
		[
			"Viajeros",
			`${request.travelers.length} ${request.travelers.length === 1 ? "persona" : "personas"}`,
		],
	]);
	y -= 6;
	section("02", "Titular y contacto", 100);
	const holder = request.travelers[0];
	fields(
		[
			[
				"Titular de la solicitud",
				`${holder.name.trim()} ${holder.lastname.trim()}`,
			],
			["Teléfono de contacto", request.contact.phone.trim()],
			["Correo electrónico", request.contact.email.trim()],
		],
		3,
	);
	y -= 6;
	section("03", "Viajeros", 94);
	for (const [index, traveler] of request.travelers.entries()) {
		const nameLines = lines(
			`${traveler.name.trim()} ${traveler.lastname.trim()}`,
			WIDTH - 104,
			11,
			bold,
		);
		const country =
			countries.find((c) => c.iso2 === traveler.country)?.nameES ||
			traveler.country;
		const details = [
			[
				"DOCUMENTO",
				`${traveler.documentType === "passport" ? "Pasaporte" : "Identidad"} · ${traveler.documentNumber.trim()}`,
			],
			["NACIMIENTO", formatPrebookingDate(traveler.dob)],
			["PAÍS EMISOR", country],
		];
		const column = (WIDTH - 32) / 3;
		const values = details.map(([, value]) => lines(value, column - 12, 9));
		const headerHeight = 18 + nameLines.length * 14;
		const height =
			headerHeight + 23 + Math.max(...values.map((v) => v.length)) * 12;
		ensure(height + 12);
		box(M, y, WIDTH, height, index % 2 === 0 ? palette.light : palette.white);
		box(M, y, 3, height, palette.green);
		text(
			String(index + 1).padStart(2, "0"),
			M + 14,
			y - 11,
			12,
			bold,
			palette.green,
		);
		nameLines.forEach((line, n) => {
			text(line, M + 47, y - 11 - n * 14, 11, bold);
		});
		if (index === 0)
			text("TITULAR", W - M - 49, y - 13, 7, bold, palette.green);
		details.forEach(([label], n) => {
			const x = M + 16 + n * column;
			text(label, x, y - headerHeight, 7, regular, palette.muted);
			values[n].forEach((line, i) => {
				text(line, x, y - headerHeight - 13 - i * 12, 9);
			});
		});
		y -= height + 10;
	}
	y -= 3;
	section("04", "Revisión y próximos pasos", 110);
	const preference = {
		minimum: "Adelanto del 50%",
		total: "Pago total",
		advice: "Prefiere asesoría antes de decidir",
	}[request.preference];
	fields([
		["Precio", "Pendiente de cotización"],
		["Preferencia de pago posterior", preference],
	]);
	const notes = [
		"Verificar fecha, circuito, horario y cupos con la fuente oficial.",
		"Contactar al titular para confirmar precio y condiciones de reserva.",
		"Coordinar el pago después de la revisión; esta solicitud no genera un cobro.",
	];
	for (const [index, note] of notes.entries()) {
		const wrapped = lines(note, WIDTH - 22, 8);
		ensure(wrapped.length * 12 + 3);
		text(String(index + 1), M, y, 8, bold, palette.green);
		wrapped.forEach((line, n) => {
			text(line, M + 16, y - n * 12, 8, regular, palette.muted);
		});
		y -= wrapped.length * 12 + 3;
	}
	y -= 3;
	ensure(8);
	text(
		"Disponibilidad no verificada. Solicitud creada desde el calendario de demostración.",
		M,
		y,
		7,
		regular,
		palette.muted,
	);
	for (const [index, p] of pdf.getPages().entries()) {
		p.drawLine({
			start: { x: M, y: 46 },
			end: { x: W - M, y: 46 },
			thickness: 0.6,
			color: palette.line,
		});
		p.drawText("DREAMY TOURS · DATOS PARA EL EQUIPO DE RESERVAS", {
			x: M,
			y: 31,
			size: 6.5,
			font: bold,
			color: palette.muted,
		});
		const footer = `${reference} · ${index + 1}/${pdf.getPageCount()}`;
		p.drawText(footer, {
			x: W - M - regular.widthOfTextAtSize(footer, 7),
			y: 31,
			size: 7,
			font: regular,
			color: palette.muted,
		});
	}
	return pdf.save();
}
