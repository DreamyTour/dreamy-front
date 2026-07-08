import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { countries } from "@/data/countries";

interface BookingCart {
  tourId?: string | number;
  tourName?: string;
  pricePerPerson?: number;
  totalPrice: number;
  passengers: number;
  date?: string;
  durationDays?: number;
  lang?: string;
  tourPath?: string;
}

interface Passenger {
  id: string;
  name: string;
  lastname: string;
  gender: string;
  dob: string;
  documentType: string;
  documentNumber: string;
  country: string;
}

interface CheckoutSummaryProps {
  initialLang?: "en" | "es" | "pt";
}

const checkoutCopy = {
  es: {
    loading: "Cargando...",
    emptyTitle: "Tu carrito esta vacio",
    emptyText: "Explora nuestros tours y comienza tu aventura",
    exploreTours: "Explorar tours",
    title: "Completa tu reserva",
    stepItinerary: "Itinerario",
    stepPassengers: "Pasajeros",
    stepPayment: "Pago",
    bookingSummary: "Resumen de reserva",
    travelDates: "Fechas de viaje",
    travelers: "Viajeros",
    person: "persona",
    people: "personas",
    perPerson: "Por persona",
    totalTourPrice: "Precio total del tour",
    continue: "Continuar",
    travelerInfo: "Informacion de viajeros",
    travelerHelp: "Completa los datos de todos los viajeros",
    passportNotice:
      "Tus datos y numero de pasaporte deben coincidir exactamente con tu documento.",
    traveler: "Viajero",
    firstName: "Nombres",
    lastName: "Apellidos",
    gender: "Genero",
    male: "Masculino",
    female: "Femenino",
    dateOfBirth: "Fecha de nacimiento",
    openBirthCalendar: "Abrir calendario de fecha de nacimiento",
    documentType: "Tipo de documento",
    passport: "Pasaporte",
    idCard: "Documento de identidad",
    documentNumber: "Numero de documento",
    issuingCountry: "Pais emisor",
    contactDetails: "Datos de contacto",
    emailAddress: "Correo electronico",
    countryCode: "Codigo de pais",
    phone: "Telefono",
    termsPrefix: "He leido y acepto los",
    terms: "Terminos y condiciones",
    termsMiddle: "y las",
    bookingPolicies: "Politicas de reserva",
    backToItinerary: "Volver al itinerario",
    continueToPayment: "Continuar al pago",
    changesNotice: "Puedes solicitar cambios escribiendo a",
    paypalNotice: "PayPal cobra una comision del 8% por procesamiento seguro.",
    paymentMethod: "Metodo de pago",
    securePayment: "Pago seguro - aplica comision de 8%",
    paymentAmount: "Monto de pago",
    popular: "POPULAR",
    payNow: "Pagar ahora",
    secureBooking: "Asegura tu reserva",
    payFull: "Pagar total",
    completePayment: "Completa tu pago",
    paypalFee: "Comision PayPal (8%)",
    totalToPayToday: "Total a pagar hoy",
    backToPassengers: "Volver a pasajeros",
    processing: "Procesando...",
    pay: "Pagar",
    summary: "Resumen",
    selectedPayment: "Pago seleccionado",
    payToday: "Pagar hoy",
    selectGender: {
      Male: "Masculino",
      Female: "Femenino",
    },
    validationTerms: "Acepta los terminos y condiciones para continuar",
    validationContact: "Completa todos los datos de contacto",
    validationTraveler: "Completa toda la informacion del viajero",
  },
  en: {
    loading: "Loading...",
    emptyTitle: "Your cart is empty",
    emptyText: "Explore our tours and start your adventure",
    exploreTours: "Explore tours",
    title: "Complete your booking",
    stepItinerary: "Itinerary",
    stepPassengers: "Passengers",
    stepPayment: "Payment",
    bookingSummary: "Booking summary",
    travelDates: "Travel dates",
    travelers: "Travelers",
    person: "person",
    people: "people",
    perPerson: "Per person",
    totalTourPrice: "Total tour price",
    continue: "Continue",
    travelerInfo: "Traveler information",
    travelerHelp: "Please fill in the details for all travelers",
    passportNotice:
      "Your details and passport number must match exactly as they appear in your passport.",
    traveler: "Traveler",
    firstName: "First name",
    lastName: "Last name",
    gender: "Gender",
    male: "Male",
    female: "Female",
    dateOfBirth: "Date of birth",
    openBirthCalendar: "Open date of birth calendar",
    documentType: "Document type",
    passport: "Passport",
    idCard: "ID card",
    documentNumber: "Document number",
    issuingCountry: "Issuing country",
    contactDetails: "Contact details",
    emailAddress: "Email address",
    countryCode: "Country code",
    phone: "Phone",
    termsPrefix: "I have read and accept the",
    terms: "Terms and Conditions",
    termsMiddle: "and",
    bookingPolicies: "Booking Policies",
    backToItinerary: "Back to itinerary",
    continueToPayment: "Continue to payment",
    changesNotice: "You can request changes by writing to",
    paypalNotice: "PayPal charges an 8% fee for secure payment processing.",
    paymentMethod: "Payment method",
    securePayment: "Secure payment - 8% fee applies",
    paymentAmount: "Payment amount",
    popular: "POPULAR",
    payNow: "Pay now",
    secureBooking: "Secure your booking",
    payFull: "Pay full",
    completePayment: "Complete your payment",
    paypalFee: "PayPal fee (8%)",
    totalToPayToday: "Total to pay today",
    backToPassengers: "Back to passengers",
    processing: "Processing...",
    pay: "Pay",
    summary: "Summary",
    selectedPayment: "Selected payment",
    payToday: "Pay today",
    selectGender: {
      Male: "Male",
      Female: "Female",
    },
    validationTerms: "Please accept the terms and conditions to continue",
    validationContact: "Please fill in all contact details",
    validationTraveler: "Please complete all information for traveler",
  },
  pt: {
    loading: "Carregando...",
    emptyTitle: "Seu carrinho esta vazio",
    emptyText: "Explore nossos tours e comece sua aventura",
    exploreTours: "Explorar tours",
    title: "Complete sua reserva",
    stepItinerary: "Itinerario",
    stepPassengers: "Passageiros",
    stepPayment: "Pagamento",
    bookingSummary: "Resumo da reserva",
    travelDates: "Datas da viagem",
    travelers: "Viajantes",
    person: "pessoa",
    people: "pessoas",
    perPerson: "Por pessoa",
    totalTourPrice: "Preco total do tour",
    continue: "Continuar",
    travelerInfo: "Informacoes dos viajantes",
    travelerHelp: "Preencha os dados de todos os viajantes",
    passportNotice:
      "Seus dados e numero do passaporte devem coincidir exatamente com o documento.",
    traveler: "Viajante",
    firstName: "Nome",
    lastName: "Sobrenome",
    gender: "Genero",
    male: "Masculino",
    female: "Feminino",
    dateOfBirth: "Data de nascimento",
    openBirthCalendar: "Abrir calendario de data de nascimento",
    documentType: "Tipo de documento",
    passport: "Passaporte",
    idCard: "Documento de identidade",
    documentNumber: "Numero do documento",
    issuingCountry: "Pais emissor",
    contactDetails: "Dados de contato",
    emailAddress: "E-mail",
    countryCode: "Codigo do pais",
    phone: "Telefone",
    termsPrefix: "Li e aceito os",
    terms: "Termos e condicoes",
    termsMiddle: "e as",
    bookingPolicies: "Politicas de reserva",
    backToItinerary: "Voltar ao itinerario",
    continueToPayment: "Continuar para pagamento",
    changesNotice: "Voce pode solicitar alteracoes escrevendo para",
    paypalNotice: "O PayPal cobra uma taxa de 8% pelo processamento seguro.",
    paymentMethod: "Metodo de pagamento",
    securePayment: "Pagamento seguro - taxa de 8% aplicada",
    paymentAmount: "Valor do pagamento",
    popular: "POPULAR",
    payNow: "Pagar agora",
    secureBooking: "Garanta sua reserva",
    payFull: "Pagar total",
    completePayment: "Complete seu pagamento",
    paypalFee: "Taxa PayPal (8%)",
    totalToPayToday: "Total a pagar hoje",
    backToPassengers: "Voltar aos passageiros",
    processing: "Processando...",
    pay: "Pagar",
    summary: "Resumo",
    selectedPayment: "Pagamento selecionado",
    payToday: "Pagar hoje",
    selectGender: {
      Male: "Masculino",
      Female: "Feminino",
    },
    validationTerms: "Aceite os termos e condicoes para continuar",
    validationContact: "Preencha todos os dados de contato",
    validationTraveler: "Complete todas as informacoes do viajante",
  },
} as const;

export default function CheckoutSummary({
  initialLang = "en",
}: CheckoutSummaryProps) {
  const copy = checkoutCopy[initialLang] ?? checkoutCopy.en;
  const [cart, setCart] = useState<BookingCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [emptyCartHref, setEmptyCartHref] = useState("/");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const firstPassengerNameRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  const todayDateValue = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // states for Passenger Step
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contact, setContact] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneCode: "+1",
    phone: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // States for Payment Step
  const [paymentOption, setPaymentOption] = useState<"minimum" | "total">(
    "minimum",
  );

  useEffect(() => {
    const savedCart = window.localStorage.getItem("bookingCart");
    const savedTourPath = window.localStorage.getItem("lastBookingTourPath");
    setEmptyCartHref(
      savedTourPath || (initialLang === "en" ? "/" : `/${initialLang}`),
    );
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as BookingCart;
        setCart(parsedCart);
        // Initialize passengers array based on count
        setPassengers(
          Array.from({ length: parsedCart.passengers || 1 }).map(
            (_, index) => ({
              id: `passenger-${index + 1}`,
              name: "",
              lastname: "",
              gender: "Male",
              dob: "",
              documentType: "Passport",
              documentNumber: "",
              country: "US",
            }),
          ),
        );
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setLoading(false);
  }, [initialLang]);

  // Clear error when user starts typing
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect intentionally clears stale errors when form state changes.
  useEffect(() => {
    setError(null);
  }, [contact, passengers, acceptedTerms]);

  // Clear error when changing steps
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect intentionally clears stale errors when the checkout step changes.
  useEffect(() => {
    setError(null);
  }, [step]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (step !== 2 || passengers.length === 0 || error) return;

    const focusTimer = window.setTimeout(() => {
      firstPassengerNameRef.current?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [step, passengers.length, error]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4">{copy.loading}</p>
      </div>
    );
  }

  // Empty cart state
  if (!cart) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {copy.emptyTitle}
        </h2>
        <p className="text-gray-500 mb-6">{copy.emptyText}</p>
        <a
          href={emptyCartHref}
          className="px-8 py-3.5 bg-primary text-white font-semibold rounded-sm shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
        >
          {copy.exploreTours}
        </a>
      </div>
    );
  }

  const handlePassengerChange = (
    index: number,
    field: keyof Passenger,
    value: string,
  ) => {
    const newPax = [...passengers];
    newPax[index] = { ...newPax[index], [field]: value };
    setPassengers(newPax);
  };

  const openDatePicker = (dateInput: HTMLInputElement | null) => {
    if (!dateInput) return;

    try {
      dateInput.showPicker();
    } catch {
      dateInput.focus();
    }
  };

  const validateStep2 = () => {
    setError(null);
    if (!acceptedTerms) {
      setError(copy.validationTerms);
      return false;
    }
    if (
      !contact.firstname ||
      !contact.lastname ||
      !contact.email ||
      !contact.phone
    ) {
      setError(copy.validationContact);
      return false;
    }
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.lastname || !p.dob || !p.documentNumber) {
        setError(`${copy.validationTraveler} ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handlePayNow = async () => {
    setIsSubmitting(true);
    // recalculate amount based on total vs minimum
    const payAmount =
      paymentOption === "total" ? cart.totalPrice : cart.totalPrice / 2;
    const fee = payAmount * 0.08;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart: {
            ...cart,
            amountToPayLabel: paymentOption,
            amountPaid: payAmount + fee,
          },
          passengersInfo: passengers,
          contactInfo: contact,
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(
          data.error || `Checkout failed with status ${response.status}`,
        );
      }

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(`Error Processing Checkout: ${data.error || "Unknown"}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network Error";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe extracting values with fallbacks to avoid crashes
  const tourName = cart.tourName || "Tour Name Unspecified";
  const paxCount = Number(cart.passengers) || 1;
  const totalPrice = Number(cart.totalPrice) || 620;
  const pricePerPerson = Number(cart.pricePerPerson) || totalPrice / paxCount;
  const date = cart.date || "";
  const durationDays = Math.max(1, Number(cart.durationDays) || 1);
  const lang = cart.lang || "en";

  let startDateStr = "TBD";
  let endDateStr = "";
  if (date) {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const localDate = new Date(y, m - 1, d);
      const endDate = new Date(y, m - 1, d + durationDays - 1);
      const locale =
        lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US";
      const dateFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      } as const;
      startDateStr = localDate.toLocaleDateString(locale, dateFormatOptions);
      endDateStr = endDate.toLocaleDateString(locale, dateFormatOptions);
    } catch {
      /* ignore */
    }
  }
  const travelDateStr =
    durationDays > 1 && endDateStr
      ? `${startDateStr} - ${endDateStr}`
      : startDateStr;

  const paymentFee =
    paymentOption === "total" ? totalPrice * 0.08 : (totalPrice / 2) * 0.08;
  const payAmount = paymentOption === "total" ? totalPrice : totalPrice / 2;
  const fieldClass =
    "min-h-12 rounded-sm border border-[#d8cec2] bg-white px-4 py-3 text-base text-[#1f2d29] outline-none transition focus:border-[#1f6c43] focus:ring-2 focus:ring-[#1f6c43]/15";
  const labelClass = "text-xs font-bold uppercase tracking-wide text-[#5f5349]";
  return (
    <div className="w-full px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto mb-6 max-w-8xl">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1f2d29] md:text-4xl">
          {copy.title}
        </h1>
      </div>
      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-8xl overflow-hidden rounded-lg border border-[#e7d7c8] bg-white shadow-[0_24px_80px_-54px_rgba(63,40,18,0.72)]">
        {/* STEPS HEADER - Minimal and clean */}
        <div className="border-b border-[#355548]/30 bg-[#244237] px-5 py-5 md:px-10">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              aria-current={step === 1 ? "step" : undefined}
              className="group flex items-center gap-3"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  step >= 1
                    ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                    : "bg-white/12 text-white/45"
                }`}
              >
                {step > 1 ? <Check size={18} /> : "1"}
              </div>
              <span
                className={`text-sm font-semibold ${step >= 1 ? "text-white" : "text-white/45"}`}
              >
                {copy.stepItinerary}
              </span>
            </button>

            {/* Connector */}
            <div className="hidden h-px w-16 bg-white/18 md:block"></div>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => step > 1 && setStep(2)}
              disabled={step <= 1}
              aria-current={step === 2 ? "step" : undefined}
              className={`flex items-center gap-3 ${step > 1 ? "group cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  step >= 2
                    ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                    : "bg-white/12 text-white/45"
                }`}
              >
                {step > 2 ? <Check size={18} /> : "2"}
              </div>
              <span
                className={`text-sm font-semibold ${step >= 2 ? "text-white" : "text-white/45"}`}
              >
                {copy.stepPassengers}
              </span>
            </button>

            {/* Connector */}
            <div className="hidden h-px w-16 bg-white/18 md:block"></div>

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  step >= 3
                    ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20"
                    : "bg-white/12 text-white/45"
                }`}
              >
                3
              </div>
              <span
                className={`text-sm font-semibold ${step >= 3 ? "text-white" : "text-white/45"}`}
              >
                {copy.stepPayment}
              </span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: ITINERARY SUMMARY ================= */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 p-6 duration-300 md:p-10">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">
                  {copy.bookingSummary}
                </h2>
                <h3 className="text-2xl font-extrabold leading-tight text-[#1f2d29] md:text-3xl">
                  {tourName}
                </h3>
              </div>
            </div>

            {/* Tour Details Card */}
            <div className="mb-8 rounded-md border border-[#e7d7c8] bg-[#fffdf9] p-5 md:p-6">
              <div className="grid gap-5 md:grid-cols-3">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#edf8f1]">
                    <Calendar className="h-6 w-6 text-[#1f6c43]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
                      {copy.travelDates}
                    </p>
                    <p className="font-semibold text-[#1f2d29]">
                      {travelDateStr}
                    </p>
                  </div>
                </div>

                {/* Passengers */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#edf8f1]">
                    <Users className="h-6 w-6 text-[#1f6c43]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
                      {copy.travelers}
                    </p>
                    <p className="font-semibold text-[#1f2d29]">
                      {paxCount} {paxCount === 1 ? copy.person : copy.people}
                    </p>
                  </div>
                </div>

                {/* Price per person */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#fff2ea]">
                    <span className="font-bold text-[#9a2f0d]">$</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6f6258]">
                      {copy.perPerson}
                    </p>
                    <p className="font-semibold text-[#1f2d29]">
                      US${pricePerPerson.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Box */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-sm border border-[#1f6c43]/15 bg-[#edf8f1] p-4 md:flex-row md:items-center md:p-5">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#1f6c43]"></div>
                <span className="font-semibold text-[#244237]">
                  {copy.totalTourPrice}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black tracking-tight text-[#1f6c43] md:text-3xl">
                  US${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="group flex min-h-12 items-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 font-semibold text-white shadow-lg shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-xl hover:shadow-[#1f6c43]/25 active:scale-[0.98]"
              >
                {copy.continue}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PASSENGER INFO ================= */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 p-6 duration-300 md:p-10">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf8f1]">
                <Users className="h-5 w-5 text-[#1f6c43]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1f2d29]">
                  {copy.travelerInfo}
                </h2>
                <p className="text-sm font-medium text-[#6f6258]">
                  {copy.travelerHelp}
                </p>
              </div>
            </div>

            {/* Alert */}
            <div className="mb-6 flex gap-3 rounded-sm border border-[#f0d3a5] bg-[#fff8ef] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9a2f0d]" />
              <p className="text-sm font-medium text-[#71300f]">
                {copy.passportNotice}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className="animate-in fade-in slide-in-from-top-2 mb-6 flex gap-3 rounded-sm border border-secondary/25 bg-secondary/10 p-4"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <p className="text-sm font-medium text-secondary">{error}</p>
              </div>
            )}

            {/* Passengers */}
            <div className="mb-10 space-y-6">
              {passengers.map((pax, i) => (
                <div
                  key={pax.id}
                  className="rounded-md border border-[#e7d7c8] bg-[#fffdf9] p-5"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                      {i + 1}
                    </div>
                    <span className="font-bold text-[#1f2d29]">
                      {copy.traveler} {i + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>{copy.firstName} *</span>
                      <input
                        ref={i === 0 ? firstPassengerNameRef : undefined}
                        type="text"
                        name={`passenger-${i + 1}-given-name`}
                        autoComplete="given-name"
                        required
                        value={pax.name}
                        onChange={(e) =>
                          handlePassengerChange(i, "name", e.target.value)
                        }
                        className={fieldClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>{copy.lastName} *</span>
                      <input
                        type="text"
                        name={`passenger-${i + 1}-family-name`}
                        autoComplete="family-name"
                        required
                        value={pax.lastname}
                        onChange={(e) =>
                          handlePassengerChange(i, "lastname", e.target.value)
                        }
                        className={fieldClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>{copy.gender} *</span>
                      <select
                        name={`passenger-${i + 1}-gender`}
                        required
                        value={pax.gender}
                        onChange={(e) =>
                          handlePassengerChange(i, "gender", e.target.value)
                        }
                        className={fieldClass}
                      >
                        <option value="Male">{copy.selectGender.Male}</option>
                        <option value="Female">
                          {copy.selectGender.Female}
                        </option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>{copy.dateOfBirth} *</span>
                      <div className="relative">
                        <input
                          id={`passenger-${i + 1}-birthdate`}
                          type="date"
                          name={`passenger-${i + 1}-birthdate`}
                          autoComplete="bday"
                          required
                          value={pax.dob}
                          onChange={(e) =>
                            handlePassengerChange(i, "dob", e.target.value)
                          }
                          onClick={(e) => openDatePicker(e.currentTarget)}
                          max={todayDateValue}
                          className={`${fieldClass} w-full cursor-pointer pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openDatePicker(
                              document.getElementById(
                                `passenger-${i + 1}-birthdate`,
                              ) as HTMLInputElement | null,
                            )
                          }
                          aria-label={copy.openBirthCalendar}
                          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-[#1f6c43] transition-colors hover:bg-[#1f6c43]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6c43]/25"
                        >
                          <Calendar className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>{copy.documentType} *</span>
                      <select
                        name={`passenger-${i + 1}-document-type`}
                        required
                        value={pax.documentType}
                        onChange={(e) =>
                          handlePassengerChange(
                            i,
                            "documentType",
                            e.target.value,
                          )
                        }
                        className={fieldClass}
                      >
                        <option value="Passport">{copy.passport}</option>
                        <option value="ID">{copy.idCard}</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={labelClass}>
                        {copy.documentNumber} *
                      </span>
                      <input
                        type="text"
                        name={`passenger-${i + 1}-document-number`}
                        autoComplete="off"
                        required
                        value={pax.documentNumber}
                        onChange={(e) =>
                          handlePassengerChange(
                            i,
                            "documentNumber",
                            e.target.value,
                          )
                        }
                        className={fieldClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className={labelClass}>
                        {copy.issuingCountry} *
                      </span>
                      <select
                        name={`passenger-${i + 1}-issuing-country`}
                        autoComplete="country"
                        required
                        value={pax.country}
                        onChange={(e) =>
                          handlePassengerChange(i, "country", e.target.value)
                        }
                        className={fieldClass}
                      >
                        {countries.map((c) => (
                          <option key={`country-${c.iso2}`} value={c.iso2}>
                            {lang === "en" ? c.nameEN : c.nameES}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
                <span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
                {copy.contactDetails}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>{copy.firstName} *</span>
                  <input
                    type="text"
                    name="contact-given-name"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    value={contact.firstname}
                    onChange={(e) =>
                      setContact({ ...contact, firstname: e.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>{copy.lastName} *</span>
                  <input
                    type="text"
                    name="contact-family-name"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    value={contact.lastname}
                    onChange={(e) =>
                      setContact({ ...contact, lastname: e.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>{copy.emailAddress} *</span>
                  <input
                    type="email"
                    name="contact-email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="john@example.com"
                    value={contact.email}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <label className="flex flex-col gap-1 w-full md:w-5/12">
                    <span className={labelClass}>{copy.countryCode} *</span>
                    <select
                      name="contact-phone-code"
                      autoComplete="tel-country-code"
                      required
                      value={contact.phoneCode}
                      onChange={(e) =>
                        setContact({ ...contact, phoneCode: e.target.value })
                      }
                      className={fieldClass}
                    >
                      {countries
                        .filter((c) => c.phoneCode)
                        .map((c) => (
                          <option
                            key={`phone-${c.iso2}`}
                            value={`+${c.phoneCode}`}
                          >
                            {lang === "en" ? c.nameEN : c.nameES} (+
                            {c.phoneCode})
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 flex-1">
                    <span className={labelClass}>{copy.phone} *</span>
                    <input
                      type="tel"
                      name="contact-phone"
                      autoComplete="tel-national"
                      inputMode="tel"
                      required
                      placeholder="123 456 7890"
                      value={contact.phone}
                      onChange={(e) =>
                        setContact({ ...contact, phone: e.target.value })
                      }
                      className={fieldClass}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="mb-8 flex cursor-pointer items-start gap-3 rounded-sm border border-[#e7d7c8] bg-[#fffdf9] p-4">
              <input
                type="checkbox"
                name="acceptedTerms"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 cursor-pointer rounded accent-[#1f6c43]"
              />
              <span className="text-sm font-medium text-[#5f5349]">
                {copy.termsPrefix}{" "}
                <a
                  href="/terms-and-conditions"
                  className="font-bold text-[#1f6c43] hover:underline"
                >
                  {copy.terms}
                </a>{" "}
                {copy.termsMiddle}{" "}
                <a
                  href="/booking-policies"
                  className="font-bold text-[#1f6c43] hover:underline"
                >
                  {copy.bookingPolicies}
                </a>
                .
              </span>
            </label>

            {/* Navigation */}
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#eadfd3] pt-6 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-sm border border-[#e7d7c8] px-5 font-semibold text-[#5f5349] transition-colors hover:bg-[#fff8ef] hover:text-[#1f2d29] sm:justify-start sm:border-0 sm:px-0"
              >
                <ArrowLeft className="w-4 h-4" />
                {copy.backToItinerary}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 font-semibold text-white shadow-lg shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-xl hover:shadow-[#1f6c43]/25 active:scale-[0.98]"
              >
                {copy.continueToPayment}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PAYMENT ================= */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 grid duration-300 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* LEFT MAIN CONTENT */}
            <div className="w-full p-5 md:p-8">
              {/* Info Banner */}
              <div className="mb-6 flex items-start gap-4 rounded-sm border border-[#1f6c43]/15 bg-[#edf8f1] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                  <Shield className="h-5 w-5 text-[#1f6c43]" />
                </div>
                <div className="space-y-1 text-sm font-medium text-[#244237]">
                  <p>
                    {copy.changesNotice}{" "}
                    <strong className="text-[#1f6c43]">
                      info@dreamy.tours
                    </strong>
                  </p>
                  <p>{copy.paypalNotice}</p>
                </div>
              </div>

              {/* Payment Method */}
              <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
                <span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
                {copy.paymentMethod}
              </h3>
              <div className="mb-8">
                <div className="flex cursor-pointer items-center justify-between rounded-sm border-2 border-[#1f6c43] bg-[#edf8f1] p-5 shadow-lg shadow-[#1f6c43]/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#003087]">
                      <span className="text-sm font-bold text-white">
                        PayPal
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-[#1f2d29]">PayPal</span>
                      <p className="text-xs text-gray-500">
                        {copy.securePayment}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1f6c43]">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Payment Amount - The stars of the show */}
              <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#1f2d29]">
                <span className="h-2 w-2 rounded-full bg-[#1f6c43]"></span>
                {copy.paymentAmount}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Minimum Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentOption("minimum")}
                  aria-pressed={paymentOption === "minimum"}
                  className={`relative flex min-h-[180px] cursor-pointer flex-col rounded-sm border-2 p-5 text-left transition-all duration-300 ${
                    paymentOption === "minimum"
                      ? "border-[#1f6c43] bg-[#edf8f1] shadow-lg shadow-[#1f6c43]/10"
                      : "border-[#e7d7c8] bg-white hover:border-[#1f6c43]/35 hover:shadow-md"
                  }`}
                >
                  {paymentOption === "minimum" && (
                    <div className="absolute -top-2.5 left-4 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
                      {copy.popular}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-sm font-bold text-[#1f2d29]">
                        {copy.payNow}
                      </span>
                      <p className="mt-0.5 text-[11px] font-medium text-[#5f5349]">
                        {copy.secureBooking}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentOption === "minimum"
                          ? "border-[#1f6c43] bg-[#1f6c43]"
                          : "border-[#cbbdac]"
                      }`}
                    >
                      {paymentOption === "minimum" && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-2">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        paymentOption === "minimum"
                          ? "text-[#1f6c43]"
                          : "text-[#6f6258]"
                      }`}
                    >
                      US${(totalPrice / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-medium text-[#6f6258]">
                      {copy.paypalFee}
                    </span>
                    <span className="text-xs font-bold text-[#1f2d29]">
                      +US${((totalPrice / 2) * 0.08).toFixed(2)}
                    </span>
                  </div>
                </button>

                {/* Total Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentOption("total")}
                  aria-pressed={paymentOption === "total"}
                  className={`relative flex min-h-[180px] cursor-pointer flex-col rounded-sm border-2 p-5 text-left transition-all duration-300 ${
                    paymentOption === "total"
                      ? "border-[#1f6c43] bg-[#edf8f1] shadow-lg shadow-[#1f6c43]/10"
                      : "border-[#e7d7c8] bg-white hover:border-[#1f6c43]/35 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-sm font-bold text-[#1f2d29]">
                        {copy.payFull}
                      </span>
                      <p className="mt-0.5 text-[11px] font-medium text-[#5f5349]">
                        {copy.completePayment}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentOption === "total"
                          ? "border-[#1f6c43] bg-[#1f6c43]"
                          : "border-[#cbbdac]"
                      }`}
                    >
                      {paymentOption === "total" && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-2">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        paymentOption === "total"
                          ? "text-[#1f6c43]"
                          : "text-[#6f6258]"
                      }`}
                    >
                      US${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-medium text-[#6f6258]">
                      {copy.paypalFee}
                    </span>
                    <span className="text-xs font-bold text-[#1f2d29]">
                      +US${(totalPrice * 0.08).toFixed(2)}
                    </span>
                  </div>
                </button>
              </div>

              {/* Total to Pay */}
              <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-sm bg-[#1f2d29] p-4 md:flex-row md:p-5">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-medium text-white/70">
                    {copy.totalToPayToday}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    US${(payAmount + paymentFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-sm border border-[#e7d7c8] px-5 font-semibold text-[#5f5349] transition-colors hover:bg-[#fff8ef] hover:text-[#1f2d29] sm:justify-start sm:border-0 sm:px-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {copy.backToPassengers}
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isSubmitting}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#1f6c43] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-[#1f6c43]/20 transition-all hover:bg-[#185637] hover:shadow-2xl hover:shadow-[#1f6c43]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {copy.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {copy.pay} US${(payAmount + paymentFee).toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT SIDEBAR - Order Summary */}
            <div className="w-full border-t border-[#eadfd3] bg-[#fffdf9] p-6 lg:border-l lg:border-t-0">
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-secondary">
                {copy.summary}
              </h4>

              <div className="mb-5 space-y-2">
                <p className="line-clamp-2 text-base font-bold leading-tight text-[#1f2d29]">
                  {tourName}
                </p>
                <p className="text-sm font-medium text-[#5f5349]">
                  {travelDateStr} · {paxCount} Pax
                </p>
              </div>

              <div className="my-5 h-px bg-[#eadfd3]"></div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium text-[#6f6258]">
                    {copy.selectedPayment}
                  </span>
                  <span className="font-bold text-[#1f2d29]">
                    US${payAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium text-[#6f6258]">
                    {copy.paypalFee}
                  </span>
                  <span className="font-bold text-[#1f2d29]">
                    US${paymentFee.toFixed(2)}
                  </span>
                </div>
                <div className="my-4 h-px bg-[#eadfd3]"></div>
                <div className="flex items-center justify-between rounded-sm bg-[#edf8f1] px-3 py-3">
                  <span className="text-lg font-bold text-[#1f6c43]">
                    {copy.payToday}
                  </span>
                  <span className="text-xl font-extrabold text-[#1f6c43]">
                    US${(payAmount + paymentFee).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
