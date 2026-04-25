'use client';

import { useState } from 'react';
import countriesData from '@/data/countries.json';

const i18n = {
  es: {
    personalInfo: 'INFORMACIÓN PERSONAL',
    names: 'Nombres',
    namesPh: 'Tu nombre completo',
    country: 'País',
    countryPh: 'Selecciona tu país',
    email: 'Email',
    emailPh: 'tu@email.com',
    whatsapp: 'WhatsApp',
    tripDetails: 'DETALLES DEL VIAJE',
    adults: 'N° Adultos',
    minors: 'N° Menores',
    date: 'Fecha de Viaje',
    langGuide: 'Idioma del Guiado',
    hotelCat: 'Categoría de Hotel',
    messageLabel: 'Cuéntanos más sobre tu viaje soñado',
    messagePh: 'Lugares que no quieres perder, detalles adicionales, tours que te interesan, etc.',
    sending: '⏳ Enviando...',
    sent: '✅ Enviado',
    errorBtn: '❌ Error',
    submitText: 'Solicitar Cotización',
    alertSuccess: '¡Gracias por contactarnos! Te responderemos en breve.',
    alertError: 'Hubo un error al enviar tu solicitud. Por favor intente nuevamente.',
    otherCountry: 'Otro',
    hotelCatList: ['2 Estrellas', '3 Estrellas', '4 Estrellas', '5 Estrellas', 'No específico']
  },
  en: {
    personalInfo: 'PERSONAL INFORMATION',
    names: 'Full Name',
    namesPh: 'Your full name',
    country: 'Country',
    countryPh: 'Select your country',
    email: 'Email',
    emailPh: 'you@email.com',
    whatsapp: 'WhatsApp',
    tripDetails: 'TRIP DETAILS',
    adults: 'N° Adults',
    minors: 'N° Minors',
    date: 'Travel Date',
    langGuide: 'Guided Language',
    hotelCat: 'Hotel Category',
    messageLabel: 'Tell us more about your dream trip',
    messagePh: "Places you don't want to miss, additional details, tours of interest, etc.",
    sending: '⏳ Sending...',
    sent: '✅ Sent',
    errorBtn: '❌ Error',
    submitText: 'Request Quote',
    alertSuccess: 'Thank you for contacting us! We will reply shortly.',
    alertError: 'There was an error sending your request. Please try again.',
    otherCountry: 'Other',
    hotelCatList: ['2 Stars', '3 Stars', '4 Stars', '5 Stars', 'Not specified']
  },
  pt: {
    personalInfo: 'INFORMAÇÃO PESSOAL',
    names: 'Nome Completo',
    namesPh: 'Seu nome completo',
    country: 'País',
    countryPh: 'Selecione o seu país',
    email: 'Email',
    emailPh: 'seu@email.com',
    whatsapp: 'WhatsApp',
    tripDetails: 'DETALHES DA VIAGEM',
    adults: 'Nº Adultos',
    minors: 'Nº Menores',
    date: 'Data de Viagem',
    langGuide: 'Idioma do Guia',
    hotelCat: 'Categoria do Hotel',
    messageLabel: 'Conte-nos mais sobre a viagem dos seus sonhos',
    messagePh: 'Lugares que não quer perder, detalhes adicionais, passeios de interesse, etc.',
    sending: '⏳ Enviando...',
    sent: '✅ Enviado',
    errorBtn: '❌ Erro',
    submitText: 'Solicitar Orçamento',
    alertSuccess: 'Obrigado por nos contatar! Responderemos em breve.',
    alertError: 'Houve um erro ao enviar a sua solicitação. Por favor, tente novamente.',
    otherCountry: 'Outro',
    hotelCatList: ['2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas', 'Não específico']
  }
};

const idiomasList = ['Español', 'English', 'Português', 'Français', 'Deutsch', 'Italiano'];

export default function PlaneaTuViaje({ lang = 'es' }: { lang?: 'es' | 'en' | 'pt' }) {
  const t = i18n[lang] || i18n['es'];

  // Cargar lista de países según idioma (idealmente traduciríamos country name pero usamos nameES por ahora)
  const paises = [
    ...countriesData.map((c: any) => ({ nombre: c.nameES, codigo: c.phoneCode })).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)),
    { nombre: t.otherCountry, codigo: '' }
  ];

  const [formData, setFormData] = useState({
    nombres: '',
    pais: '',
    email: '',
    adultos: '1',
    menores: '0',
    fechaViaje: '',
    idioma: idiomasList[0],
    categoriaHotel: t.hotelCatList[4],
    mensaje: ''
  });

  const [codigoPais, setCodigoPais] = useState('51');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Obtener código de país al seleccionar país
  const handlePaisChange = (paisNombre: string) => {
    const pais = paises.find(p => p.nombre === paisNombre);
    if (pais) {
      setCodigoPais(pais.codigo || '');
    }
    setFormData(prev => ({ ...prev, pais: paisNombre }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/planea-tu-viaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, codigoPais, formLanguage: lang })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setFormData({
          nombres: '',
          pais: '',
          email: '',
          adultos: '1',
          menores: '0',
          fechaViaje: '',
          idioma: idiomasList[0],
          categoriaHotel: t.hotelCatList[4],
          mensaje: ''
        });
        setCodigoPais('51');
        alert(t.alertSuccess);
      } else {
        throw new Error(result.error || 'Error en el envío');
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus('error');
      alert(t.alertError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.88)',
  };

  const buttonStyle = () => {
    if (submitStatus === 'success') {
      return { background: 'linear-gradient(to right, #22c55e, #16a34a)' };
    }
    if (submitStatus === 'error') {
      return { background: 'linear-gradient(to right, #ef4444, #dc2626)' };
    }
    return {
      background: 'linear-gradient(to right, var(--primary), oklch(0.6 0.15 148))',
    };
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-sm p-5  md:p-8"
    >
      <div className="flex items-center gap-3 pb-5">
        <div className="h-[2px] w-12 rounded-full bg-primary/70" />
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* INFORMACION PERSONAL */}
      <section className="bg-white rounded-sm p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] md:p-6">
        <div className="mb-5 flex items-end justify-between gap-4 pb-4">
          <div>
            <span className="mb-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">
              01
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {t.personalInfo}
            </h3>
          </div>
          <div className="hidden h-px flex-1 bg-stone-100 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="nombres" className="mb-2 block text-sm font-medium text-foreground">
              {t.names} <span className="text-red-500">*</span>
            </label>
            <input
              id="nombres"
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              required
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t.namesPh}
            />
          </div>

          <div>
            <label htmlFor="pais" className="mb-2 block text-sm font-medium text-foreground">
              {t.country} <span className="text-red-500">*</span>
            </label>
            <select
              id="pais"
              name="pais"
              value={formData.pais}
              onChange={(e) => handlePaisChange(e.target.value)}
              required
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">{t.countryPh}</option>
              {paises.map(pais => (
                <option key={pais.nombre} value={pais.nombre}>{pais.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
              {t.email} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t.emailPh}
            />
          </div>

          <div>
            <label htmlFor="telefono" className="mb-2 block text-sm font-medium text-foreground">
              {t.whatsapp}
            </label>
            <div className="flex overflow-hidden rounded-sm shadow-sm">
              <span
                className="flex items-center border border-r-0 border-border px-4 py-3 text-sm font-medium bg-muted text-foreground"
              >
                +{codigoPais || '51'}
              </span>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                style={{ ...inputStyle, borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                className="w-full rounded-r-sm border border-border px-4 py-3 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="999 999 999"
              />
            </div>
          </div>
        </div>
      </section>

      {/* DETALLES DEL VIAJE */}
      <section className="bg-white/80 rounded-sm p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] md:p-6">
        <div className="mb-5 flex items-end justify-between gap-4 pb-4">
          <div>
            <span className="mb-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">
              02
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {t.tripDetails}
            </h3>
          </div>
          <div className="hidden h-px flex-1 bg-stone-100 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="adultos" className="mb-2 block text-sm font-medium text-foreground">
              {t.adults}
            </label>
            <input
              id="adultos"
              type="number"
              name="adultos"
              value={formData.adultos}
              onChange={handleChange}
              min="1"
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label htmlFor="menores" className="mb-2 block text-sm font-medium text-foreground">
              {t.minors}
            </label>
            <input
              id="menores"
              type="number"
              name="menores"
              value={formData.menores}
              onChange={handleChange}
              min="0"
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label htmlFor="fechaViaje" className="mb-2 block text-sm font-medium text-foreground">
              {t.date}
            </label>
            <input
              id="fechaViaje"
              type="date"
              name="fechaViaje"
              value={formData.fechaViaje}
              onChange={handleChange}
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label htmlFor="idioma" className="mb-2 block text-sm font-medium text-foreground">
              {t.langGuide}
            </label>
            <select
              id="idioma"
              name="idioma"
              value={formData.idioma}
              onChange={handleChange}
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {idiomasList.map(idioma => (
                <option key={idioma} value={idioma}>{idioma}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="categoriaHotel" className="mb-2 block text-sm font-medium text-foreground">
              {t.hotelCat}
            </label>
            <select
              id="categoriaHotel"
              name="categoriaHotel"
              value={formData.categoriaHotel}
              onChange={handleChange}
              style={inputStyle}
              className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {t.hotelCatList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje */}
        <div className="mt-5">
          <label htmlFor="mensaje" className="mb-2 block text-sm font-medium text-foreground">
            {t.messageLabel}
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            rows={4}
            style={inputStyle}
            className="w-full rounded-sm border border-border px-4 py-3 text-sm shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder={t.messagePh}
          ></textarea>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          style={buttonStyle()}
          className="w-full rounded-sm px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all shadow-[0_18px_36px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isSubmitting ? t.sending : submitStatus === 'success' ? t.sent : submitStatus === 'error' ? t.errorBtn : t.submitText}
        </button>
      </div>
    </form>
  );
}
