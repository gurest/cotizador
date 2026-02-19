import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

// Helper para textos
const val = (condicion: boolean, textoTrue: string, textoFalse: string = 'No incluido') => condicion ? textoTrue : textoFalse;
const txt = (valor: any, sufijo: string = '') => (valor && valor !== '0') ? `${valor} ${sufijo}` : 'No especificado';

// --- GENERADOR DE MENSAJE DETALLADO (WhatsApp / Email) ---
function construirMensajeDetallado(item: any): string {
  const d = item.datosInput || {};
  const des = item.desglose || {};

  let msg = `🏗️ *PRESUPUESTO QUICKSHEED: ${item.nombreProyecto}*\n`;
  msg += `📅 Fecha: ${formatearFecha(item.fecha)}\n\n`;

  // 1. Dimensiones
  msg += `📐 *DIMENSIONES*\n`;
  msg += `• Nave: ${d.ancho}m x ${d.largo}m (Alto: ${d.altoHombrera}m)\n`;
  msg += `• Pendiente: ${d.pendiente}%\n\n`;

  // 2. Estructura
  msg += `🔩 *ESTRUCTURA*\n`;
  msg += `• Columna: ${d.tipoColumna} ${d.medidaColumna || ''}\n`;
  if (d.tipoColumna === 'Reticulado') msg += `  (Relleno: ${d.materialReticuladoColumna})\n`;
  msg += `• Viga: ${d.tipoViga} ${d.medidaViga || ''}\n`;
  if (d.tipoViga === 'Reticulado') msg += `  (Relleno: ${d.materialReticuladoViga})\n\n`;

  // 3. Cerramientos
  msg += `🛡️ *CERRAMIENTOS*\n`;
  msg += `• Lat: ${val(d.cerramientoLateral, `SÍ (${d.cerramientoLateralChapa || 'Std'})`)}\n`;
  msg += `• Fte/Fnd: ${val(d.cerramientoFrenteFondo, `SÍ (${d.cerramientoFrenteFondoChapa || 'Std'})`)}\n`;
  msg += `• Aisl. Techo: ${val(d.aislacionTecho, `SÍ (${d.tipoAislacionTecho})`)}\n`;
  msg += `• Aisl. Pared: ${val(d.aislacionLateral, 'SÍ')}\n\n`;

  // 4. Accesos y Extras
  msg += `🚪 *ACCESOS Y EXTRAS*\n`;
  msg += `• Portones: ${val(d.portones, `SÍ (${d.cantidadPortones}u. ${d.portonesAncho}x${d.portonesAlto}m)`)}\n`;
  msg += `• Ptas Emergencia: ${val(d.puertasAuxiliares, `SÍ (${d.cantidadPuertasAuxiliares}u.)`)}\n`;
  msg += `• Chapas Traslúcidas: ${val(d.chapasTraslucidas, `SÍ (${d.cantidadChapasTraslucidas}u.)`)}\n`;
  msg += `• Eólicos: ${val(d.ventilacionEolica, `SÍ (${d.cantidadEolicos}u.)`)}\n\n`;

  // 5. Obra Civil
  msg += `🚜 *OBRA CIVIL*\n`;
  msg += `• Piso: ${val(d.pisoHormigon, `SÍ (${d.tipoHormigon} ${d.espesorPiso})`)}\n`;
  msg += `• Entrada: ${val(d.hormigonEntrada, `SÍ (${d.distanciaEntrada}m)`)}\n`;
  msg += `• Estudio Suelo: ${val(d.estudioSuelo, 'Incluido')}\n\n`;

  // 6. Logística
  msg += `🚚 *LOGÍSTICA*\n`;
  msg += `• Distancia: ${d.distanciaKm} km\n`;
  msg += `• Elevación: ${val(d.incluirElevacion, 'Incluida')}\n\n`;

  // TOTALES
  msg += `💰 *TOTAL FINAL: USD ${item.total?.toFixed(2)}*\n`;
  msg += `--------------------------------\n`;
  msg += `Materiales: USD ${des.materialesEstructura}\n`;
  msg += `Cubiertas: USD ${des.cubiertasYAislaciones}\n`;
  msg += `Accesorios: USD ${des.accesorios}\n`;
  msg += `Obra Civil: USD ${des.pisoObraCivil}\n`;
  msg += `Mano de Obra: USD ${des.manoDeObra}\n`;
  msg += `Logística/Ing: USD ${des.logisticaYOtros}\n`;

  return msg;
}

// --- ACCIONES ---
async function enviarPorWhatsApp(item: any) {
  const mensaje = construirMensajeDetallado(item);
  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback si no abre directo (web)
      await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`);
    }
  } catch {
    Alert.alert('Error', 'No se pudo abrir WhatsApp.');
  }
}

async function enviarPorEmail(item: any) {
  const asunto = `Presupuesto: ${item.nombreProyecto}`;
  const cuerpo = construirMensajeDetallado(item);
  const url = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', 'No se pudo abrir la app de correo.');
  }
}

// --- COMPONENTE VISUAL ---
export default function DetalleHistorialScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const lista = raw ? JSON.parse(raw) : [];
      // El ID viene como string del params, pero se guardó como number
      const encontrado = lista.find((i: any) => i.id == id);
      setItem(encontrado || null);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Componente de Fila para no repetir código visual
  const Row = ({ label, value, isBool = false }: { label: string, value: any, isBool?: boolean }) => {
    let display = value;
    let inactive = false;
    if (isBool) {
      display = value ? 'SÍ' : 'No incluido';
      inactive = !value;
    } else if (!value || value === '0' || value === 0) {
      display = 'No especificado';
      inactive = true;
    }
    return (
      <View style={styles.row}>
        <Text style={styles.labelRow}>{label}</Text>
        <Text style={[styles.valueRow, inactive && styles.valueInactive]}>{display}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.flex}><Text style={styles.loadingText}>Cargando...</Text></View>;
  if (!item) return <View style={styles.flex}><Text style={styles.loadingText}>No encontrado.</Text></View>;

  const d = item.datosInput || {};
  const des = item.desglose || {};

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLE DE PROYECTO</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        
        {/* TARJETA PRINCIPAL */}
        <View style={styles.mainCard}>
          <Text style={styles.projectTitle}>{item.nombreProyecto}</Text>
          <Text style={styles.projectDate}>{formatearFecha(item.fecha)}</Text>
          <Text style={styles.totalPrice}>USD {item.total?.toFixed(2)}</Text>
        </View>

        {/* 1. DIMENSIONES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DIMENSIONES & ESTRUCTURA</Text>
          <Row label="Medidas" value={`${d.ancho}x${d.largo}m (Alto ${d.altoHombrera}m)`} />
          <Row label="Pendiente" value={`${d.pendiente}%`} />
          <View style={styles.divider} />
          <Row label="Columna" value={`${d.tipoColumna} ${d.medidaColumna || ''}`} />
          {d.tipoColumna === 'Reticulado' && <Row label="Relleno Col." value={d.materialReticuladoColumna} />}
          <Row label="Viga" value={`${d.tipoViga} ${d.medidaViga || ''}`} />
          {d.tipoViga === 'Reticulado' && <Row label="Relleno Viga" value={d.materialReticuladoViga} />}
        </View>

        {/* 2. CERRAMIENTOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CERRAMIENTOS</Text>
          <Row label="Lateral" value={d.cerramientoLateral ? `${d.cerramientoLateralChapa || 'Std'}` : false} isBool />
          <Row label="Fte/Fnd" value={d.cerramientoFrenteFondo ? `${d.cerramientoFrenteFondoChapa || 'Std'}` : false} isBool />
          <Row label="Aisl. Techo" value={d.aislacionTecho ? d.tipoAislacionTecho : false} isBool />
          <Row label="Aisl. Pared" value={d.aislacionLateral} isBool />
        </View>

        {/* 3. ACCESORIOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCESOS & EXTRAS</Text>
          <Row label="Portones" value={d.portones ? `${d.cantidadPortones}u.` : false} isBool />
          <Row label="Ptas. Aux" value={d.puertasAuxiliares ? `${d.cantidadPuertasAuxiliares}u.` : false} isBool />
          <Row label="Traslúcidas" value={d.chapasTraslucidas ? `${d.cantidadChapasTraslucidas}u.` : false} isBool />
          <Row label="Eólicos" value={d.ventilacionEolica ? `${d.cantidadEolicos}u.` : false} isBool />
        </View>

        {/* 4. OBRA CIVIL & LOGISTICA */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CIVIL & LOGÍSTICA</Text>
          <Row label="Piso Hormigón" value={d.pisoHormigon ? `${d.tipoHormigon}` : false} isBool />
          <Row label="Entrada" value={d.hormigonEntrada ? `${d.distanciaEntrada}m` : false} isBool />
          <View style={styles.divider} />
          <Row label="Distancia" value={`${d.distanciaKm} km`} />
          <Row label="Elevación" value={d.incluirElevacion} isBool />
        </View>

        {/* 5. DESGLOSE ECONÓMICO */}
        <View style={[styles.card, { borderColor: '#F59E0B' }]}>
           <Text style={[styles.cardTitle, { color: '#F59E0B' }]}>DESGLOSE DE COSTOS</Text>
           <Row label="Materiales Est." value={`USD ${des.materialesEstructura}`} />
           <Row label="Cubiertas" value={`USD ${des.cubiertasYAislaciones}`} />
           <Row label="Accesorios" value={`USD ${des.accesorios}`} />
           <Row label="Obra Civil" value={`USD ${des.pisoObraCivil}`} />
           <Row label="Mano de Obra" value={`USD ${des.manoDeObra}`} />
           <Row label="Logística" value={`USD ${des.logisticaYOtros}`} />
        </View>

        {/* BOTONES ACCION */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={() => enviarPorWhatsApp(item)} activeOpacity={0.8}>
           <Text style={styles.btnText}>📱 COMPARTIR POR WHATSAPP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emailBtn} onPress={() => enviarPorEmail(item)} activeOpacity={0.8}>
           <Text style={styles.btnText}>✉️ ENVIAR POR EMAIL</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 50 },
  
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, backgroundColor: '#1E1E1E', borderBottomWidth: 1, borderBottomColor: '#27272A', flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingRight: 10 },
  backText: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 10 },

  scroll: { flex: 1 },
  container: { padding: 16 },

  mainCard: { backgroundColor: '#F59E0B', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  projectTitle: { fontSize: 22, fontWeight: '900', color: '#000', textAlign: 'center' },
  projectDate: { fontSize: 14, color: '#333', marginBottom: 8 },
  totalPrice: { fontSize: 30, fontWeight: '900', color: '#000' },

  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  cardTitle: { color: '#71717A', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  labelRow: { color: '#A1A1AA', fontSize: 14, flex: 1 },
  valueRow: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  valueInactive: { color: '#52525B', fontStyle: 'italic', fontWeight: '400' },

  whatsappBtn: { backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  emailBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});