import {
	PDFDocument,
	type PDFFont,
	type PDFPage,
	rgb,
	StandardFonts,
} from "pdf-lib/dist/pdf-lib.esm.js";
import {
	DREAMY_LOGO_GREEN_PATHS,
	DREAMY_LOGO_WORDMARK_PATH,
} from "./dreamyLogoVector";

export interface PrebookingPdfPassenger {
	name: string;
	lastname: string;
	gender: string;
	dob: string;
	age: number;
	country: string;
	documentType: string;
	documentNumber: string;
}

export interface PrebookingPdfData {
	reference: string;
	createdAt: string;
	tourName: string;
	travelDate: string;
	travelEndDate: string;
	permitDate: string;
	road: string;
	availableSpaces: number;
	passengerCount: number;
	pricePerPerson: number;
	totalPrice: number;
	paymentPreference: string;
	preferredPaymentAmount: number;
	contact: {
		firstname: string;
		lastname: string;
		email: string;
		phone: string;
	};
	passengers: PrebookingPdfPassenger[];
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 30;
const PAGE_BOTTOM = 52;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export function normalizePrebookingText(value: unknown) {
	return String(value ?? "").normalize("NFC");
}

function safePdfText(value: unknown, font: PDFFont) {
	return Array.from(normalizePrebookingText(value))
		.map((character) => {
			try {
				font.encodeText(character);
				return character;
			} catch {
				return "?";
			}
		})
		.join("");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
	const words = safePdfText(text, font).split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let currentLine = "";

	for (const word of words) {
		if (font.widthOfTextAtSize(word, size) > maxWidth) {
			if (currentLine) {
				lines.push(currentLine);
				currentLine = "";
			}

			let chunk = "";
			for (const character of word) {
				const candidate = `${chunk}${character}`;
				if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
					chunk = candidate;
					continue;
				}
				if (chunk) lines.push(chunk);
				chunk = character;
			}
			currentLine = chunk;
			continue;
		}

		const candidate = currentLine ? `${currentLine} ${word}` : word;
		if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
			currentLine = candidate;
			continue;
		}

		if (currentLine) lines.push(currentLine);
		currentLine = word;
	}

	if (currentLine) lines.push(currentLine);
	return lines.length > 0 ? lines : [""];
}

function fitTextSize(
	text: string,
	font: PDFFont,
	maxWidth: number,
	preferredSize: number,
	minimumSize = 6,
) {
	let size = preferredSize;
	while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) {
		size -= 0.25;
	}
	return size;
}

export function formatPrebookingDate(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value.trim());
	return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function formatMoney(value: number) {
	return `US$ ${new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value)}`;
}

export function bytesToBase64(bytes: Uint8Array) {
	let binary = "";
	const chunkSize = 0x8000;

	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(
			...bytes.subarray(offset, offset + chunkSize),
		);
	}

	return btoa(binary);
}

export async function generatePrebookingPdf(data: PrebookingPdfData) {
	const document = await PDFDocument.create();
	const regularFont = await document.embedFont(StandardFonts.Helvetica);
	const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
	const brandGreen = rgb(0, 164 / 255, 61 / 255);
	const brandGreenDark = rgb(0, 0.42, 0.16);
	const brandGreenSoft = rgb(0.91, 0.97, 0.93);
	const brandGreenPale = rgb(0.965, 0.99, 0.972);
	const brandRed = rgb(183 / 255, 21 / 255, 50 / 255);
	const brandRedDark = rgb(0.52, 0.035, 0.12);
	const brandRedSoft = rgb(0.985, 0.92, 0.93);
	const ink = rgb(18 / 255, 16 / 255, 13 / 255);
	const neutral700 = rgb(0.24, 0.24, 0.23);
	const neutral500 = rgb(0.38, 0.38, 0.37);
	const neutral400 = rgb(0.47, 0.47, 0.45);
	const neutral200 = rgb(0.82, 0.85, 0.82);
	const white = rgb(1, 1, 1);
	let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let hasStartedFirstPage = false;
	let y = 0;

	document.setTitle(`Pre-reserva ${data.reference}`);
	document.setAuthor("Dreamy Tours");
	document.setSubject("Solicitud operativa de pre-reserva y cotización");
	document.setProducer("Dreamy Tours");
	document.setCreationDate(new Date());

	const drawRightText = (
		targetPage: PDFPage,
		text: string,
		right: number,
		baseline: number,
		size: number,
		font: PDFFont,
		color: ReturnType<typeof rgb>,
	) => {
		const safeText = safePdfText(text, font);
		targetPage.drawText(safeText, {
			x: right - font.widthOfTextAtSize(safeText, size),
			y: baseline,
			size,
			font,
			color,
		});
	};

	const drawFittedText = (
		targetPage: PDFPage,
		text: string,
		x: number,
		baseline: number,
		maxWidth: number,
		preferredSize: number,
		font: PDFFont,
		color: ReturnType<typeof rgb>,
		minimumSize = 6,
	) => {
		const safeText = safePdfText(text, font);
		targetPage.drawText(safeText, {
			x,
			y: baseline,
			size: fitTextSize(safeText, font, maxWidth, preferredSize, minimumSize),
			font,
			color,
		});
	};

	type PdfColor = ReturnType<typeof rgb>;

	const drawRoundedFill = (
		targetPage: PDFPage,
		x: number,
		bottom: number,
		width: number,
		height: number,
		radius: number,
		color: PdfColor,
	) => {
		const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
		if (safeRadius === 0) {
			targetPage.drawRectangle({ x, y: bottom, width, height, color });
			return;
		}
		targetPage.drawRectangle({
			x: x + safeRadius,
			y: bottom,
			width: width - safeRadius * 2,
			height,
			color,
		});
		targetPage.drawRectangle({
			x,
			y: bottom + safeRadius,
			width,
			height: height - safeRadius * 2,
			color,
		});
		for (const [circleX, circleY] of [
			[x + safeRadius, bottom + safeRadius],
			[x + width - safeRadius, bottom + safeRadius],
			[x + safeRadius, bottom + height - safeRadius],
			[x + width - safeRadius, bottom + height - safeRadius],
		] as const) {
			targetPage.drawCircle({
				x: circleX,
				y: circleY,
				size: safeRadius,
				color,
			});
		}
	};

	const drawRoundedRectangle = (
		targetPage: PDFPage,
		options: {
			x: number;
			bottom: number;
			width: number;
			height: number;
			radius?: number;
			color: PdfColor;
			borderColor?: PdfColor;
			borderWidth?: number;
		},
	) => {
		const radius = options.radius ?? 6;
		const borderWidth = options.borderColor
			? Math.max(options.borderWidth ?? 0.7, 0.35)
			: 0;
		if (options.borderColor && borderWidth > 0) {
			drawRoundedFill(
				targetPage,
				options.x,
				options.bottom,
				options.width,
				options.height,
				radius,
				options.borderColor,
			);
		}
		drawRoundedFill(
			targetPage,
			options.x + borderWidth,
			options.bottom + borderWidth,
			options.width - borderWidth * 2,
			options.height - borderWidth * 2,
			Math.max(0, radius - borderWidth),
			options.color,
		);
	};

	const drawPill = (
		targetPage: PDFPage,
		text: string,
		x: number,
		bottom: number,
		options: {
			font?: PDFFont;
			size?: number;
			paddingX?: number;
			height?: number;
			background?: ReturnType<typeof rgb>;
			color?: ReturnType<typeof rgb>;
			borderColor?: ReturnType<typeof rgb>;
			maxWidth?: number;
		} = {},
	) => {
		const font = options.font ?? boldFont;
		const size = options.size ?? 6.5;
		const paddingX = options.paddingX ?? 7;
		const height = options.height ?? 14;
		const safeText = safePdfText(text, font);
		const naturalWidth = font.widthOfTextAtSize(safeText, size) + paddingX * 2;
		const width = Math.min(options.maxWidth ?? naturalWidth, naturalWidth);
		drawRoundedRectangle(targetPage, {
			x,
			bottom,
			width,
			height,
			radius: height / 2,
			color: options.background ?? white,
			borderColor: options.borderColor,
			borderWidth: options.borderColor ? 0.6 : 0,
		});
		drawFittedText(
			targetPage,
			safeText,
			x + paddingX,
			bottom + (height - size) / 2 + 0.7,
			width - paddingX * 2,
			size,
			font,
			options.color ?? neutral700,
			5.5,
		);
		return width;
	};

	const drawOfficialLogo = (
		targetPage: PDFPage,
		x: number,
		bottom: number,
		width: number,
		height: number,
	) => {
		drawRoundedRectangle(targetPage, {
			x,
			bottom,
			width,
			height,
			radius: 7,
			color: white,
		});
		const scale = (width - 12) / 1354.27;
		const logoX = x + 6;
		const logoTop = bottom + height - 4;
		for (const path of DREAMY_LOGO_GREEN_PATHS) {
			targetPage.drawSvgPath(path, {
				x: logoX,
				y: logoTop,
				scale,
				color: brandGreen,
			});
		}
		targetPage.drawSvgPath(DREAMY_LOGO_WORDMARK_PATH, {
			x: logoX,
			y: logoTop,
			scale,
			color: ink,
		});
	};

	const startPage = (continued = false) => {
		if (hasStartedFirstPage) {
			page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
		}
		hasStartedFirstPage = true;

		if (!continued) {
			const headerBottom = 704;
			drawRoundedRectangle(page, {
				x: PAGE_MARGIN,
				bottom: headerBottom,
				width: CONTENT_WIDTH,
				height: 111,
				radius: 9,
				color: white,
				borderColor: neutral200,
				borderWidth: 0.8,
			});
			drawRoundedRectangle(page, {
				x: PAGE_MARGIN,
				bottom: 808,
				width: CONTENT_WIDTH,
				height: 7,
				radius: 3.5,
				color: brandGreen,
			});
			drawOfficialLogo(page, 44, 758, 124, 42);
			page.drawText("SOLICITUD DE PRE-RESERVA", {
				x: 187,
				y: 786,
				size: 11.2,
				font: boldFont,
				color: ink,
			});
			drawPill(page, "PENDIENTE", 360, 779, {
				size: 6.3,
				height: 15,
				background: brandRed,
				color: white,
				borderColor: brandRed,
			});
			drawFittedText(
				page,
				data.tourName,
				187,
				765,
				218,
				8.2,
				boldFont,
				brandGreenDark,
			);
			drawRoundedRectangle(page, {
				x: 420,
				bottom: 753,
				width: 131,
				height: 44,
				radius: 6,
				color: brandGreenPale,
				borderColor: brandGreenSoft,
				borderWidth: 0.6,
			});
			page.drawText("REFERENCIA", {
				x: 430,
				y: 784,
				size: 5.3,
				font: boldFont,
				color: neutral400,
			});
			drawFittedText(page, data.reference, 430, 773, 111, 7, boldFont, ink);
			page.drawText("SOLICITUD", {
				x: 430,
				y: 763,
				size: 5.3,
				font: boldFont,
				color: neutral400,
			});
			drawFittedText(
				page,
				data.createdAt,
				430,
				756,
				111,
				5.8,
				regularFont,
				neutral700,
				5,
			);

			drawRoundedRectangle(page, {
				x: 44,
				bottom: 715,
				width: 507,
				height: 27,
				radius: 6,
				color: brandRedSoft,
				borderColor: rgb(0.94, 0.72, 0.75),
				borderWidth: 0.6,
			});
			page.drawCircle({ x: 58, y: 728.5, size: 4.5, color: brandRed });
			page.drawText("!", {
				x: 56.8,
				y: 726.4,
				size: 5.6,
				font: boldFont,
				color: white,
			});
			drawFittedText(
				page,
				"No se ha realizado ningún cobro. Validar disponibilidad y datos antes de confirmar con el cliente.",
				70,
				725.5,
				468,
				6.8,
				regularFont,
				brandRedDark,
				6,
			);
			y = 690;
			return;
		}

		drawRoundedRectangle(page, {
			x: PAGE_MARGIN,
			bottom: 758,
			width: CONTENT_WIDTH,
			height: 57,
			radius: 8,
			color: white,
			borderColor: neutral200,
			borderWidth: 0.7,
		});
		drawOfficialLogo(page, 42, 768, 102, 37);
		page.drawText("PRE-RESERVA · CONTINUACIÓN", {
			x: 160,
			y: 786,
			size: 10,
			font: boldFont,
			color: ink,
		});
		drawRightText(
			page,
			data.reference,
			PAGE_WIDTH - 42,
			786,
			8,
			boldFont,
			brandGreenDark,
		);
		y = 744;
	};

	const ensureSpace = (height: number) => {
		if (y - height >= PAGE_BOTTOM) return false;
		startPage(true);
		return true;
	};

	const beginSection = (
		number: string,
		title: string,
		aside: string,
		height: number,
	) => {
		ensureSpace(height);
		const top = y;
		drawRoundedRectangle(page, {
			x: PAGE_MARGIN,
			bottom: top - height,
			width: CONTENT_WIDTH,
			height,
			radius: 7,
			color: white,
			borderColor: neutral200,
			borderWidth: 0.7,
		});
		page.drawCircle({
			x: 49,
			y: top - 19,
			size: 9,
			color: brandGreen,
		});
		const safeNumber = safePdfText(number, boldFont);
		page.drawText(safeNumber, {
			x: 49 - boldFont.widthOfTextAtSize(safeNumber, 6.7) / 2,
			y: top - 21.4,
			size: 6.7,
			font: boldFont,
			color: white,
		});
		page.drawText(title, {
			x: 64,
			y: top - 22.5,
			size: 9.5,
			font: boldFont,
			color: ink,
		});
		const asideSafe = safePdfText(aside, regularFont);
		const asideWidth = regularFont.widthOfTextAtSize(asideSafe, 6.2) + 14;
		drawPill(
			page,
			asideSafe,
			PAGE_WIDTH - PAGE_MARGIN - 14 - asideWidth,
			top - 27,
			{
				font: regularFont,
				size: 6.2,
				height: 14,
				background: white,
				color: brandGreenDark,
				borderColor: brandGreenSoft,
			},
		);
		page.drawLine({
			start: { x: 44, y: top - 35 },
			end: { x: PAGE_WIDTH - 44, y: top - 35 },
			thickness: 0.6,
			color: neutral200,
		});
		y = top - height - 7;
		return top;
	};

	const drawField = (
		label: string,
		value: string,
		x: number,
		top: number,
		width: number,
		valueColor = ink,
	) => {
		page.drawText(label, {
			x,
			y: top - 7,
			size: 6.2,
			font: regularFont,
			color: neutral400,
		});
		drawFittedText(
			page,
			value,
			x,
			top - 20,
			width,
			8.2,
			boldFont,
			valueColor,
			6.5,
		);
	};

	startPage();

	{
		const top = beginSection(
			"01",
			"RESUMEN DEL VIAJE",
			"disponibilidad consultada",
			85,
		);
		const fieldTop = top - 43;
		drawField(
			"FECHAS DE VIAJE",
			`${formatPrebookingDate(data.travelDate)} – ${formatPrebookingDate(data.travelEndDate)}`,
			44,
			fieldTop,
			190,
		);
		drawField("PASAJEROS", String(data.passengerCount), 260, fieldTop, 75);
		page.drawText("CUPOS", {
			x: 366,
			y: fieldTop - 7,
			size: 6.2,
			font: regularFont,
			color: neutral400,
		});
		drawPill(page, `${data.availableSpaces} disponibles`, 366, fieldTop - 25, {
			size: 6.8,
			height: 15,
			background: brandGreenSoft,
			color: brandGreenDark,
			maxWidth: 140,
		});
		page.drawText("RUTA OFICIAL", {
			x: 44,
			y: top - 74,
			size: 6.2,
			font: regularFont,
			color: neutral400,
		});
		drawFittedText(
			page,
			`Camino Inca – Ruta ${data.road}`,
			102,
			top - 74,
			220,
			7.5,
			boldFont,
			neutral700,
		);
	}

	{
		const top = beginSection("02", "RESUMEN ECONÓMICO", "importes en USD", 90);
		const boxY = top - 80;
		const boxHeight = 38;
		const boxWidth = 246;
		drawRoundedRectangle(page, {
			x: 44,
			bottom: boxY,
			width: boxWidth,
			height: boxHeight,
			radius: 7,
			color: white,
			borderColor: neutral200,
			borderWidth: 0.7,
		});
		drawRoundedRectangle(page, {
			x: 305,
			bottom: boxY,
			width: boxWidth,
			height: boxHeight,
			radius: 7,
			color: brandGreenPale,
			borderColor: brandGreen,
			borderWidth: 0.7,
		});
		page.drawText("MONTO TOTAL DEL TOUR", {
			x: 55,
			y: boxY + 26,
			size: 6.2,
			font: regularFont,
			color: neutral400,
		});
		page.drawText(formatMoney(data.totalPrice), {
			x: 55,
			y: boxY + 11,
			size: fitTextSize(formatMoney(data.totalPrice), boldFont, 130, 13, 10),
			font: boldFont,
			color: ink,
		});
		drawFittedText(
			page,
			`${data.passengerCount} pasajero${data.passengerCount === 1 ? "" : "s"} × ${formatMoney(data.pricePerPerson)} c/u`,
			170,
			boxY + 12,
			108,
			6.2,
			regularFont,
			neutral400,
			5.5,
		);

		drawFittedText(
			page,
			`PAGO PREFERIDO (${data.paymentPreference})`,
			316,
			boxY + 26,
			222,
			6.2,
			regularFont,
			neutral400,
		);
		page.drawText(formatMoney(data.preferredPaymentAmount), {
			x: 316,
			y: boxY + 11,
			size: fitTextSize(
				formatMoney(data.preferredPaymentAmount),
				boldFont,
				115,
				13,
				10,
			),
			font: boldFont,
			color: brandGreen,
		});
		drawFittedText(
			page,
			"Monto para enlace de pago · NO COBRADO",
			433,
			boxY + 12,
			105,
			5.8,
			boldFont,
			brandRed,
			5,
		);
	}

	{
		const top = beginSection("03", "CONTACTO DEL TITULAR", "Viajero 1", 72);
		const boxY = top - 62;
		const boxes = [
			{
				x: 44,
				width: 146,
				label: "NOMBRE",
				value: `${data.contact.firstname} ${data.contact.lastname}`,
				color: ink,
			},
			{
				x: 198,
				width: 204,
				label: "CORREO",
				value: data.contact.email,
				color: brandGreenDark,
			},
			{
				x: 410,
				width: 141,
				label: "WHATSAPP",
				value: data.contact.phone,
				color: ink,
			},
		];
		for (const contactBox of boxes) {
			drawRoundedRectangle(page, {
				x: contactBox.x,
				bottom: boxY,
				width: contactBox.width,
				height: 22,
				radius: 5,
				color: white,
				borderColor: neutral200,
				borderWidth: 0.6,
			});
			page.drawText(contactBox.label, {
				x: contactBox.x + 8,
				y: boxY + 13,
				size: 5.5,
				font: boldFont,
				color: neutral400,
			});
			drawFittedText(
				page,
				contactBox.value,
				contactBox.x + 8,
				boxY + 4,
				contactBox.width - 16,
				7.1,
				boldFont,
				contactBox.color,
				5.5,
			);
		}
	}

	{
		const passengerHeight =
			48 +
			data.passengers.length * 55 +
			Math.max(0, data.passengers.length - 1) * 6 +
			8;
		const top = beginSection(
			"04",
			"DATOS DE PASAJEROS",
			`X ${data.passengerCount} PAX`,
			passengerHeight,
		);
		let passengerTop = top - 43;

		data.passengers.forEach((passenger, index) => {
			const cardHeight = 55;
			const cardBottom = passengerTop - cardHeight;
			drawRoundedRectangle(page, {
				x: 44,
				bottom: cardBottom,
				width: 507,
				height: cardHeight,
				radius: 6,
				color: white,
				borderColor: index === 0 ? brandGreen : neutral200,
				borderWidth: 0.6,
			});
			drawRoundedRectangle(page, {
				x: 49,
				bottom: cardBottom + 7,
				width: 3,
				height: cardHeight - 14,
				radius: 1.5,
				color: index === 0 ? brandGreen : neutral200,
			});

			const passengerName = safePdfText(
				`${passenger.name} ${passenger.lastname}`,
				boldFont,
			);
			page.drawCircle({
				x: 65,
				y: passengerTop - 13,
				size: 7,
				color: brandRedSoft,
				borderColor: brandRed,
				borderWidth: 0.5,
			});
			const passengerNumber = String(index + 1);
			page.drawText(passengerNumber, {
				x: 65 - boldFont.widthOfTextAtSize(passengerNumber, 6.2) / 2,
				y: passengerTop - 15.2,
				size: 6.2,
				font: boldFont,
				color: brandRedDark,
			});
			drawFittedText(
				page,
				passengerName,
				78,
				passengerTop - 15,
				345,
				8.6,
				boldFont,
				ink,
				6.5,
			);
			drawPill(
				page,
				index === 0 ? "TITULAR · CONTACTO" : `VIAJERO ${index + 1}`,
				index === 0 ? 438 : 465,
				passengerTop - 20,
				{
					font: boldFont,
					size: 5.5,
					height: 12,
					background: index === 0 ? brandGreen : brandGreenSoft,
					color: index === 0 ? white : brandGreenDark,
					maxWidth: index === 0 ? 103 : 76,
				},
			);

			const passengerFields = [
				{ label: "GÉNERO", value: passenger.gender, x: 58, width: 55 },
				{ label: "PAÍS", value: passenger.country, x: 120, width: 61 },
				{
					label: "TIPO DE DOCUMENTO",
					value: passenger.documentType,
					x: 188,
					width: 83,
				},
				{
					label: "NÚMERO",
					value: passenger.documentNumber,
					x: 278,
					width: 84,
				},
				{
					label: "NACIMIENTO",
					value: formatPrebookingDate(passenger.dob),
					x: 369,
					width: 91,
				},
				{
					label: "EDAD",
					value: `${passenger.age} años`,
					x: 467,
					width: 70,
				},
			];
			for (const field of passengerFields) {
				drawFittedText(
					page,
					field.label,
					field.x,
					cardBottom + 23,
					field.width,
					5,
					boldFont,
					neutral400,
					4.4,
				);
				drawFittedText(
					page,
					field.value,
					field.x,
					cardBottom + 10,
					field.width,
					6.5,
					field.label === "EDAD" ? boldFont : regularFont,
					field.label === "EDAD" ? brandGreenDark : ink,
					5.2,
				);
			}
			passengerTop = cardBottom - 6;
		});
	}

	{
		const top = beginSection("05", "ACCIÓN DEL AGENTE", "siguiente paso", 112);
		const actionY = top - 89;
		const actionWidth = 161;
		const actions = [
			{
				x: 44,
				label: "REVISAR",
				description: "Cupos, permiso y datos de pasajeros.",
				background: brandGreenSoft,
				color: brandGreenDark,
				borderColor: brandGreenSoft,
			},
			{
				x: 217,
				label: "CONTACTAR",
				description: "Confirmar condiciones con el cliente.",
				background: brandRedSoft,
				color: brandRed,
				borderColor: brandRedSoft,
			},
			{
				x: 390,
				label: "ENVIAR PAGO",
				description: "Generar el enlace por el monto preferido.",
				background: brandGreen,
				color: white,
				borderColor: brandGreen,
			},
		];
		for (const action of actions) {
			drawRoundedRectangle(page, {
				x: action.x,
				bottom: actionY,
				width: actionWidth,
				height: 46,
				radius: 7,
				color: white,
				borderColor: action.borderColor,
				borderWidth: 0.6,
			});
			drawPill(page, action.label, action.x + 8, actionY + 27, {
				size: 5.9,
				height: 12,
				background: action.background,
				color: action.color,
			});
			const lines = wrapText(
				action.description,
				regularFont,
				6.7,
				actionWidth - 16,
			);
			lines.slice(0, 2).forEach((line, index) => {
				page.drawText(line, {
					x: action.x + 8,
					y: actionY + 16 - index * 8,
					size: 6.7,
					font: regularFont,
					color: neutral700,
				});
			});
		}

		drawRoundedRectangle(page, {
			x: 44,
			bottom: top - 103,
			width: 507,
			height: 12,
			radius: 5,
			color: brandGreenPale,
			borderColor: brandGreenSoft,
			borderWidth: 0.5,
		});
		page.drawText(
			"La pre-reserva no confirma el tour hasta validar y recibir el pago.",
			{
				x: 52,
				y: top - 99.5,
				size: 5.8,
				font: boldFont,
				color: brandGreenDark,
			},
		);
	}

	const pages = document.getPages();
	pages.forEach((pdfPage, index) => {
		pdfPage.drawLine({
			start: { x: PAGE_MARGIN, y: 38 },
			end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 38 },
			thickness: 0.5,
			color: brandGreenSoft,
		});
		pdfPage.drawText("INFORMACIÓN OPERATIVA · DREAMY TOURS", {
			x: PAGE_MARGIN,
			y: 24,
			size: 5.8,
			font: boldFont,
			color: neutral400,
		});
		drawRightText(
			pdfPage,
			`${data.reference} · PÁGINA ${index + 1} DE ${pages.length}`,
			PAGE_WIDTH - PAGE_MARGIN,
			24,
			5.8,
			boldFont,
			neutral500,
		);
	});

	return document.save();
}
