import type { Lang } from "./i18n";

export const MACHU_PICCHU_AVAILABILITY_SLUGS = {
	es: "disponibilidad-machu-picchu",
	en: "machu-picchu-availability",
	pt: "disponibilidade-machu-picchu",
} satisfies Record<Lang, string>;

const translations: Record<string, [string, string]> = {
	"Código de solicitud": ["Request reference", "Código da solicitação"],
	"Disponibilidad por circuito y horario": [
		"Availability by circuit and time",
		"Disponibilidade por circuito e horário",
	],
	"Reserva tu visita a": ["Plan your visit to", "Planeje sua visita a"],
	"Tres pasos simples: elige tu circuito, el mes y el horario perfecto.": [
		"Three simple steps: choose your circuit, month and preferred time.",
		"Três passos simples: escolha o circuito, o mês e o horário ideal.",
	],
	Rutas: ["Routes", "Rotas"],
	Duración: ["Duration", "Duração"],
	"Elige el mes": ["Choose your month", "Escolha o mês"],
	"Paso 1 de 3": ["Step 1 of 3", "Passo 1 de 3"],
	"Paso 2 de 3": ["Step 2 of 3", "Passo 2 de 3"],
	"Paso 3 de 3": ["Step 3 of 3", "Passo 3 de 3"],
	"Mes de visita": ["Month of visit", "Mês da visita"],
	Año: ["Year", "Ano"],
	"Los meses y días pasados no se pueden seleccionar.": [
		"Past months and dates cannot be selected.",
		"Meses e datas anteriores não podem ser selecionados.",
	],
	Actualizar: ["Refresh", "Atualizar"],
	Disponible: ["Available", "Disponível"],
	"Últimos cupos": ["Limited availability", "Últimas vagas"],
	Agotado: ["Sold out", "Esgotado"],
	"Elige tu circuito": ["Choose your circuit", "Escolha seu circuito"],
	"Tipo de boleto": ["Ticket type", "Tipo de ingresso"],
	Circuito: ["Circuit", "Circuito"],
	Ruta: ["Route", "Rota"],
	Ingreso: ["Entry", "Entrada"],
	"Elige el horario": ["Choose your time", "Escolha o horário"],
	"Los horarios disponibles varían según el circuito y la demanda del día.": [
		"Available times vary by circuit and demand for the day.",
		"Os horários disponíveis variam conforme o circuito e a procura do dia.",
	],
	"Tu reserva": ["Your booking", "Sua reserva"],
	"Se completa a medida que eliges": [
		"Updated as you make your selections",
		"Atualizada conforme suas escolhas",
	],
	Mes: ["Month", "Mês"],
	Fecha: ["Date", "Data"],
	Horario: ["Time", "Horário"],
	Visitantes: ["Visitors", "Visitantes"],
	"Por definir": ["To be decided", "A definir"],
	"Precio de la visita": ["Visit price", "Preço da visita"],
	"Pendiente de cotización": ["Quote pending", "Orçamento pendente"],
	"Solicitar pre-reserva": [
		"Request a provisional booking",
		"Solicitar pré-reserva",
	],
	"La disponibilidad puede cambiar. Un agente revisará tu solicitud antes de confirmar disponibilidad y precio. No se realiza ningún cobro.":
		[
			"Availability may change. An agent will review your request before confirming availability and price. No payment is taken.",
			"A disponibilidade pode mudar. Um agente analisará sua solicitação antes de confirmar a disponibilidade e o preço. Nenhuma cobrança é realizada.",
		],
	Importante: ["Please note", "Importante"],
	"Llega con 30 minutos de anticipación. Solo se permite un ingreso por boleto.":
		[
			"Arrive 30 minutes early. Each ticket allows a single entry.",
			"Chegue com 30 minutos de antecedência. Cada ingresso permite apenas uma entrada.",
		],
	"mes pasado": ["past month", "mês anterior"],
	"fecha pasada": ["past date", "data anterior"],
	"Sin datos": ["No data", "Sem dados"],
	cupos: ["spaces", "vagas"],
	disponibles: ["available", "disponíveis"],
	"Consultando disponibilidad...": [
		"Checking availability...",
		"Consultando disponibilidade...",
	],
	"Cupos por fecha para Ruta": [
		"Spaces by date for Route",
		"Vagas por data para a Rota",
	],
	"Selecciona otra ruta para comparar.": [
		"Select another route to compare.",
		"Selecione outra rota para comparar.",
	],
	"No hay datos publicados para este mes y ruta.": [
		"No data has been published for this month and route.",
		"Não há dados publicados para este mês e rota.",
	],
	"No pudimos consultar los cupos. Intenta de nuevo o cambia el mes.": [
		"We couldn't check availability. Try again or select another month.",
		"Não foi possível consultar as vagas. Tente novamente ou escolha outro mês.",
	],
	"No pudimos guardar tu selección. Habilita el almacenamiento del navegador para continuar.":
		[
			"We couldn't save your selection. Enable browser storage to continue.",
			"Não foi possível salvar sua seleção. Ative o armazenamento do navegador para continuar.",
		],
	"Circuito 1 - Panorámico": [
		"Circuit 1 - Panoramic",
		"Circuito 1 - Panorâmico",
	],
	"Circuito 2 - Clásico": ["Circuit 2 - Classic", "Circuito 2 - Clássico"],
	"Circuito 3 - Machupicchu Realeza": [
		"Circuit 3 - Machupicchu Royalty",
		"Circuito 3 - Realeza de Machupicchu",
	],
	"Montaña Machupicchu": ["Machupicchu Mountain", "Montanha Machupicchu"],
	"Terraza superior": ["Upper terrace", "Terraço superior"],
	"Portada Intipunku": ["Intipunku Gateway", "Portal Intipunku"],
	"Puente Inka": ["Inka Bridge", "Ponte Inka"],
	"Clásico diseñada": ["Classic Designed", "Clássico desenhado"],
	"Terraza inferior": ["Lower terrace", "Terraço inferior"],
	"Montaña Waynapicchu": ["Waynapicchu Mountain", "Montanha Waynapicchu"],
	"Realeza diseñada": ["Royalty Designed", "Realeza desenhada"],
	"Gran Caverna": ["Great Cavern", "Grande Caverna"],
	Huchuypicchu: ["Huchuypicchu", "Huchuypicchu"],
};

export function availabilityTranslator(lang: Lang) {
	return (text: string) =>
		lang === "es"
			? text
			: (translations[text]?.[lang === "en" ? 0 : 1] ?? text);
}
