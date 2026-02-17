import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Asegúrate de que este tipo coincida con lo que guardamos en cotizar.tsx
import type { ItemHistorial } from '../cotizar';

const STORAGE_KEY_HISTORIAL = '@cotizador_historial';

function formatearFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function valorONo(val: string | number | undefined): string {
  if (val === undefined || val === '') return '—';
  return String(val);
}

// --- GENERADOR DE TEXTO (SIRVE PARA WHATSAPP Y EMAIL) ---
function construirMensajeDetallado(item: ItemHistorial): string {
  const d = item.dimensiones;
  const ancho = d?.ancho ?? 0;
  const largo = d?.largo ?? 0;
  const alto = d?.alto ?? 0;
  const pendiente = d?.pendiente ?? 0;
  
  // Encabezado
  let msg = `🏗️ *PRESUPUESTO: ${item.nombreProyecto}*\n`;
  msg += `📅 Fecha: ${formatearFecha(item.fecha)}\n\n`;

  // 1. Dimensiones y Estructura
  msg += `📐 *DIMENSIONES Y ESTRUCTURA*\n`;
  msg += `• Nave: ${ancho}m x ${largo}m (Sup. ${ancho * largo}m²)\n`;
  msg += `• Altura: ${alto}m | Pendiente: ${pendiente}%\n`;
  msg += `• Columnas: ${item.tipoColumna || 'No especificado'}\n`;
  msg += `• Vigas: ${item.tipoViga || 'No especificado'}\n\n`;

  // 2. Cerramientos y Aislaciones
  msg += `🛡️ *CERRAMIENTOS Y CUBIERTA*\n`;
  msg += `• *Techo:* Aislación ${item.aislacionTecho ? (item.tipoAislacionTecho || 'Estándar') : 'NO'}\n`;

  if (item.cerramientoLateral) {
    msg += `• *Laterales:* SÍ (Chapa: ${item.cerramientoLateralChapa || 'Estándar'})\n`;
    if (item.aislacionLateral) msg += `  - Aislación: ${item.tipoAislacionLateral || 'Estándar'}\n`;
  } else {
    msg += `• *Laterales:* NO (Abierto)\n`;
  }

  if (item.cerramientoFrenteFondo) {
    msg += `• *Frente/Fondo:* SÍ (Chapa: ${item.cerramientoFrenteFondoChapa || 'Estándar'})\n`;
    if (item.aislacionFrenteFondo) msg += `  - Aislación: ${item.tipoAislacionFrenteFondo || 'Estándar'}\n`;
  } else {
    msg += `• *Frente/Fondo:* NO (Abierto)\n`;
  }
  msg += `\n`;

  // 3. Pisos
  if (item.pisoHormigon) {
    msg += `🚜 *PISO INDUSTRIAL*\n`;
    msg += `• Tipo: ${item.tipoHormigon || 'Hormigón'}\n`;
    msg += `• Espesor: ${item.espesorPiso || '?'} cm\n`;
    msg += `• Terminación: ${item.terminacionPiso || 'Alisado Mecánico'}\n\n`;
  } else {
    msg += `🚜 *PISO:* No incluido (Suelo natural/compactado)\n\n`;
  }

  // 4. Accesos
  if (item.portones) {
    msg += `🚪 *ACCESOS*\n`;
    msg += `• Cantidad: ${item.cantidadPortones}\n`;
    msg += `• Medidas: ${item.portonesAncho}m x ${item.portonesAlto}m\n`;
    msg += `• Tipo: ${item.portonesTipoApertura || 'Corredizo'}\n`;
    msg += `• Chapa: ${item.portonesChapa || 'Igual al resto'}\n\n`;
  }

  // 5. Logística (NUEVO BLOQUE)
  msg += `🚚 *LOGÍSTICA Y EJECUCIÓN*\n`;
  if (item.distanciaKm && item.distanciaKm > 0) {
    msg += `• Ubicación: Obra a ${item.distanciaKm} km de base operativa.\n`;
    msg += `• Flete: Transporte de materiales y equipos incluido.\n`;
  } else {
    msg += `• Flete: A definir según ubicación final.\n`;
  }
  
  if (item.incluirElevacion) {
    msg += `• Medios de Elevación: ✅ INCLUIDOS (Grúa/Tijera según corresponda).\n\n`;
  } else {
    msg += `• Medios de Elevación: ❌ A cargo del cliente.\n\n`;
  }

  // Cierre
  msg += `💰 *INVERSIÓN TOTAL: USD ${Number(item.precioFinal).toFixed(2)}*\n`;
  msg += `⚠️ _Presupuesto válido por 7 días._\n`;
  msg += `Atte: *Carmon Cotizador*`;

  return msg;
}

// --- FUNCIÓN WHATSAPP ---
async function enviarPorWhatsApp(item: ItemHistorial): Promise<void> {
  const mensaje = construirMensajeDetallado(item);
  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'No se pudo abrir WhatsApp.');
  }
}

// --- FUNCIÓN EMAIL (NUEVA) ---
async function enviarPorEmail(item: ItemHistorial): Promise<void> {
  const asunto = `Presupuesto: ${item.nombreProyecto}`;
  const cuerpo = construirMensajeDetallado(item);
  const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se encontró una aplicación de correo instalada.');
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo abrir el correo.');
  }
}

export default function DetalleCotizacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ItemHistorial | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const lista: ItemHistorial[] = raw ? JSON.parse(raw) : [];
      const numId = Number(id);
      const encontrado = lista.find((i) => i.id === numId) ?? null;
      setItem(encontrado);
    } catch {
      setItem(null);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.texto}>Cargando...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.texto}>Cotización no encontrada.</Text>
        <TouchableOpacity style={styles.volverBtn} onPress={() => router.back()}>
          <Text style={styles.volverBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = item.dimensiones;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.bloque}>
        <Text style={styles.tituloPrincipal}>{item.nombreProyecto}</Text>
        <Text style={styles.fecha}>{formatearFecha(item.fecha)}</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.seccion}>Dimensiones</Text>
        <Text style={styles.linea}>Ancho: {valorONo(d?.ancho)} m</Text>
        <Text style={styles.linea}>Largo: {valorONo(d?.largo)} m</Text>
        <Text style={styles.linea}>Alto: {valorONo(d?.alto)} m</Text>
        <Text style={styles.linea}>Pendiente: {valorONo(d?.pendiente)} %</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.seccion}>Tipología</Text>
        <Text style={styles.linea}>Columna: {valorONo(item.tipoColumna)}</Text>
        <Text style={styles.linea}>Viga: {valorONo(item.tipoViga)}</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.seccion}>Detalles Constructivos</Text>
        <Text style={styles.linea}>
          Lat: {item.cerramientoLateral ? 'SÍ' : 'NO'} 
          {item.cerramientoLateral && ` (${item.cerramientoLateralChapa})`}
        </Text>
        <Text style={styles.linea}>
          Fte/Fondo: {item.cerramientoFrenteFondo ? 'SÍ' : 'NO'}
          {item.cerramientoFrenteFondo && ` (${item.cerramientoFrenteFondoChapa})`}
        </Text>
        <Text style={styles.linea}>
          Aisl. Techo: {item.aislacionTecho ? 'SÍ' : 'NO'}
          {item.aislacionTecho && ` (${item.tipoAislacionTecho})`}
        </Text>
        <Text style={styles.linea}>
          Piso: {item.pisoHormigon ? 'SÍ' : 'NO'}
          {item.pisoHormigon && ` (${item.tipoHormigon} - ${item.espesorPiso})`}
        </Text>
      </View>

      {/* NUEVA SECCIÓN VISUAL LOGÍSTICA */}
      <View style={styles.bloque}>
        <Text style={styles.seccion}>Logística y Equipos</Text>
        <Text style={styles.linea}>
          Distancia: {item.distanciaKm ? `${item.distanciaKm} km` : 'No especificada'}
        </Text>
        <Text style={styles.linea}>
          Medios de Elevación: {item.incluirElevacion ? '✅ INCLUIDOS' : '❌ NO INCLUIDOS'}
        </Text>
      </View>

      <View style={styles.bloquePrecio}>
        <Text style={styles.precioLabel}>PRECIO TOTAL</Text>
        <Text style={styles.precioValor}>USD {item.precioFinal.toFixed(2)}</Text>
      </View>

      {/* BOTÓN WHATSAPP */}
      <TouchableOpacity
        style={styles.whatsappBtn}
        onPress={() => enviarPorWhatsApp(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.whatsappBtnText}>📱 ENVIAR POR WHATSAPP</Text>
      </TouchableOpacity>

      {/* BOTÓN EMAIL */}
      <TouchableOpacity
        style={styles.emailBtn}
        onPress={() => enviarPorEmail(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.emailBtnText}>✉️ ENVIAR POR EMAIL</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.volverBtn} onPress={() => router.back()}>
        <Text style={styles.volverBtnText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#c4c4c4' },
  container: { padding: 16, paddingBottom: 32 },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#c4c4c4',
  },
  texto: { fontSize: 16, marginBottom: 16 },
  bloque: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tituloPrincipal: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  fecha: { fontSize: 14, color: '#666' },
  seccion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#374151',
  },
  linea: { fontSize: 15, marginBottom: 4, color: '#1f2937' },
  bloquePrecio: {
    backgroundColor: '#0c4a6e',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  precioLabel: { fontSize: 14, color: '#bae6fd', marginBottom: 4, fontWeight: '600' },
  precioValor: { fontSize: 28, fontWeight: '700', color: '#fff' },
  
  // Estilo WhatsApp
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    marginBottom: 12,
  },
  whatsappBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Estilo Email (NUEVO)
  emailBtn: {
    backgroundColor: '#3b82f6', // Azul
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    marginBottom: 24,
  },
  emailBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  volverBtn: {
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  volverBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});