import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineChevronDown,
} from 'react-icons/hi';

const FALLBACK_TERMS = `Bienvenido a Te Guio. Al acceder y utilizar nuestra plataforma, usted acepta cumplir con los siguientes terminos y condiciones de uso.

1. Aceptacion de los Terminos
Al registrarse y utilizar Te Guio, usted acepta estos terminos en su totalidad. Si no esta de acuerdo con alguna parte, le recomendamos no utilizar la plataforma.

2. Descripcion del Servicio
Te Guio es una plataforma de descubrimiento para galerias comerciales fisicas donde compradores pueden explorar productos y tiendas organizados por ciudad, zona y galeria.

3. Uso de la Plataforma
Los usuarios se comprometen a utilizar la plataforma de manera responsable, no publicar contenido falso o enganoso, y respetar a los demas usuarios de la comunidad.

4. Propiedad Intelectual
Todo el contenido de la plataforma, incluyendo disenos, logotipos y textos, es propiedad de Te Guio y esta protegido por las leyes de propiedad intelectual.

5. Limitacion de Responsabilidad
Te Guio actua como intermediario de descubrimiento. No somos responsables directos de las transacciones realizadas entre compradores y vendedores en las tiendas fisicas.`;

const FALLBACK_PRIVACY = `En Te Guio nos comprometemos a proteger su privacidad y sus datos personales.

1. Informacion que Recopilamos
Recopilamos informacion personal como nombre, correo electronico, telefono y ubicacion para brindarle una mejor experiencia en la plataforma.

2. Uso de la Informacion
Utilizamos su informacion para personalizar su experiencia, mejorar nuestros servicios, enviar notificaciones relevantes y garantizar la seguridad de la plataforma.

3. Proteccion de Datos
Implementamos medidas de seguridad tecnicas y organizativas para proteger su informacion personal contra acceso no autorizado, alteracion o destruccion.

4. Compartir Informacion
No vendemos ni compartimos su informacion personal con terceros, excepto cuando sea necesario para el funcionamiento de la plataforma o cuando la ley lo requiera.

5. Sus Derechos
Usted tiene derecho a acceder, rectificar y eliminar sus datos personales. Puede ejercer estos derechos contactandonos a traves de la plataforma.`;

function AccordionSection({ icon: Icon, title, linkText, version, content, isOpen, onToggle }) {
  return (
    <div className="bg-surface rounded-2xl shadow-card border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Header - clickable */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-600">{linkText}</p>
          <p className="text-xs text-gray-400 mt-0.5">{version}</p>
        </div>
        <HiOutlineChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Expandable content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 pt-1">
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">{title}</h3>
            <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  const [loading, setLoading] = useState(true);
  const [termsData, setTermsData] = useState(null);
  const [privacyData, setPrivacyData] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        apiClient.get('/catalog/terms/current'),
        apiClient.get('/catalog/privacy/current'),
      ]);

      // Terms
      if (results[0].status === 'fulfilled' && results[0].value?.data?.terminos) {
        setTermsData(results[0].value.data.terminos);
      }

      // Privacy
      if (results[1].status === 'fulfilled' && results[1].value?.data?.privacidad) {
        setPrivacyData(results[1].value.data.privacidad);
      }
    } catch {
      // fallback content will be used
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  if (loading) return <LoadingSpinner />;

  const termsContent = termsData?.contenido || FALLBACK_TERMS;
  const termsVersion = termsData
    ? `Version ${termsData.numero_version}.0`
    : 'Version 1.2';

  const privacyContent = privacyData?.contenido || FALLBACK_PRIVACY;
  const privacyVersion = privacyData
    ? `Version ${privacyData.numero_version}.0`
    : 'Version 1.2';

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center mb-8 pt-2">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <HiOutlineShieldCheck className="w-9 h-9 text-primary-600" style={{ fontSize: 64 }} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 font-display">
          Terminos y Condiciones
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Conoce nuestras politicas y terminos de uso
        </p>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4">
        <AccordionSection
          icon={HiOutlineDocumentText}
          title={termsData?.titulo || 'Terminos y Condiciones de Uso'}
          linkText="Terminos y Condiciones"
          version={termsVersion}
          content={termsContent}
          isOpen={openSection === 'terms'}
          onToggle={() => toggleSection('terms')}
        />

        <AccordionSection
          icon={HiOutlineShieldCheck}
          title={privacyData?.titulo || 'Politica de Privacidad'}
          linkText="Politica de Privacidad"
          version={privacyVersion}
          content={privacyContent}
          isOpen={openSection === 'privacy'}
          onToggle={() => toggleSection('privacy')}
        />
      </div>
    </div>
  );
}
