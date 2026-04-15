import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../features/auth/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiOutlineQuestionMarkCircle, HiOutlineChevronDown } from 'react-icons/hi';

const FALLBACK_FAQS = [
  {
    pregunta: '¿Que es Te Guio?',
    respuesta:
      'Te Guio es una plataforma digital que conecta compradores con vendedores en zonas comerciales, permitiendote explorar productos y tiendas de manera facil y rapida desde tu dispositivo movil.',
  },
  {
    pregunta: '¿Te Guio es gratis?',
    respuesta:
      'Si, Te Guio es completamente gratis para los compradores. Puedes explorar productos, buscar tiendas y crear listas de compras sin ningun costo.',
  },
  {
    pregunta: '¿Como funciona Te Guio?',
    respuesta:
      'Te Guio te permite buscar productos y tiendas en zonas comerciales cercanas. Puedes ver catalogos de productos, comparar precios, guardar favoritos y crear listas de compras para organizar tus visitas.',
  },
  {
    pregunta: '¿En que zonas comerciales me guiara el aplicativo?',
    respuesta:
      'Te Guio esta disponible en diversas zonas comerciales de la ciudad. Puedes consultar las zonas disponibles desde la seccion de busqueda, donde encontraras galerias y tiendas registradas en cada zona.',
  },
  {
    pregunta: '¿Que productos puedo encontrar?',
    respuesta:
      'En Te Guio puedes encontrar una gran variedad de productos organizados por categorias, desde ropa y calzado hasta electronica y accesorios. Los vendedores publican sus catalogos con precios actualizados.',
  },
  {
    pregunta: '¿Todos los vendedores de la zona comercial publican sus productos en Te Guio?',
    respuesta:
      'No necesariamente. Te Guio trabaja con vendedores registrados que han decidido publicar sus productos en la plataforma. Cada vez mas vendedores se suman para ofrecer mayor variedad a los compradores.',
  },
];

export default function FAQPage() {
  const { usuario } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  const audiencia = usuario?.rol === 'VENDEDOR' ? 'SELLER' : 'BUYER';

  useEffect(() => {
    loadFaqs();
  }, [audiencia]);

  const loadFaqs = async () => {
    try {
      const { data } = await apiClient.get('/catalog/faqs', { params: { audiencia } });
      if (Array.isArray(data) && data.length > 0) {
        setFaqs(data);
      } else {
        setFaqs(FALLBACK_FAQS);
      }
    } catch {
      setFaqs(FALLBACK_FAQS);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-8 pt-2">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <HiOutlineQuestionMarkCircle className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 font-display">
          Preguntas Frecuentes
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Encuentra respuestas a las dudas mas comunes
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-surface rounded-2xl shadow-card border border-gray-100/80 overflow-hidden transition-all duration-200 hover:shadow-card-hover"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none"
            >
              <span className="text-sm font-medium text-gray-800 pr-4 whitespace-pre-line">
                {faq.pregunta}
              </span>
              <HiOutlineChevronDown
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-4 pt-0">
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                    {faq.respuesta}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
