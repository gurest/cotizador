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

function construirMensajeWhatsApp(item: ItemHistorial): string {
  const d = item.dimensiones;
  const ancho = d?.ancho ?? 0;
  const largo = d?.largo ?? 0;
  const alto = d?.alto ?? 0;
  const pendiente = d?.pendiente ?? 0;
  const tipoColumna = item.tipoColumna || '—';
  const tipoViga = item.tipoViga || '—';

  const detalles: string[] = [];
  if (item.cerramientoLateral || item.cerramientoFrenteFondo) {
    const partes: string[] = [];
    if (item.cerramientoLateral) partes.push('laterales');
    if (item.cerramientoFrenteFondo) partes.push('frente/fondo');
    detalles.push(`Cerramientos (${partes.join(', ')})`);
  }
  if (item.aislacionLateral || item.aislacionFrenteFondo || item.aislacionTecho) {
    detalles.push('Aislación');
  }
  if (item.portones) detalles.push('Portones');
  if (item.pisoHormigon) detalles.push('Piso');

  const lineaDetalles = detalles.length > 0 ? detalles.join(', ') : 'Estructura base';

  return [
    `🏗️ *PRESUPUESTO:* ${item.nombreProyecto}`,
    `📏 *Dimensiones:* ${ancho}m x ${largo}m`,
    `🔼 *Altura:* ${alto}m | *Pendiente:* ${pendiente}%`,
    `🛠️ *Estructura:* Columnas ${tipoColumna} y Vigas ${tipoViga}`,
    '',
    '📝 *Detalles técnicos:*',
    lineaDetalles,
    '',
    `💵 *VALOR TOTAL:* USD ${Number(item.precioFinal).toFixed(2)}`,
    '⚠️ Este presupuesto tiene una validez de 7 días.',
    '📧 Generado por Angel - Cotizador Industrial.',
  ].join('\n');
}

async function enviarPorWhatsApp(item: ItemHistorial): Promise<void> {
  const mensaje = construirMensajeWhatsApp(item);
  const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;
  try {
    const puedeAbrir = await Linking.canOpenURL(url);
    if (!puedeAbrir) {
      Alert.alert('', 'WhatsApp no está instalado en este dispositivo.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('', 'WhatsApp no está instalado en este dispositivo.');
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
        <Text style={styles.linea}>Tipo de columna: {valorONo(item.tipoColumna)}</Text>
        <Text style={styles.linea}>Tipo de viga: {valorONo(item.tipoViga)}</Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.seccion}>Cerramientos</Text>
        <Text style={styles.linea}>
          Cerramiento lateral: {item.cerramientoLateral ? 'Sí' : 'No'}
          {item.cerramientoLateral && item.cerramientoLateralChapa
            ? ` (Chapa: ${item.cerramientoLateralChapa})`
            : ''}
        </Text>
        {item.cerramientoLateral && (
          <Text style={styles.linea}>
            Aislación lateral: {item.aislacionLateral ? 'Sí' : 'No'}
            {item.aislacionLateral && item.tipoAislacionLateral
              ? ` (${item.tipoAislacionLateral})`
              : ''}
          </Text>
        )}
        <Text style={styles.linea}>
          Cerramiento frente/fondo: {item.cerramientoFrenteFondo ? 'Sí' : 'No'}
          {item.cerramientoFrenteFondo && item.cerramientoFrenteFondoChapa
            ? ` (Chapa: ${item.cerramientoFrenteFondoChapa})`
            : ''}
        </Text>
        {item.cerramientoFrenteFondo && (
          <Text style={styles.linea}>
            Aislación frente/fondo: {item.aislacionFrenteFondo ? 'Sí' : 'No'}
            {item.aislacionFrenteFondo && item.tipoAislacionFrenteFondo
              ? ` (${item.tipoAislacionFrenteFondo})`
              : ''}
          </Text>
        )}
        <Text style={styles.linea}>Portones: {item.portones ? 'Sí' : 'No'}</Text>
        {item.portones && (
          <>
            <Text style={styles.linea}>  Cantidad: {valorONo(item.cantidadPortones)}</Text>
            <Text style={styles.linea}>  Configuración: {valorONo(item.configuracionPorton)}</Text>
            <Text style={styles.linea}>  Ancho: {valorONo(item.portonesAncho)} m</Text>
            <Text style={styles.linea}>  Alto: {valorONo(item.portonesAlto)} m</Text>
            <Text style={styles.linea}>  Apertura: {valorONo(item.portonesTipoApertura)}</Text>
            <Text style={styles.linea}>  Chapa: {valorONo(item.portonesChapa)}</Text>
          </>
        )}
        <Text style={styles.linea}>
          Aislación techo: {item.aislacionTecho ? 'Sí' : 'No'}
          {item.aislacionTecho && item.tipoAislacionTecho
            ? ` (${item.tipoAislacionTecho})`
            : ''}
        </Text>
      </View>

      <View style={styles.bloque}>
        <Text style={styles.seccion}>Piso</Text>
        <Text style={styles.linea}>Incluye piso de hormigón: {item.pisoHormigon ? 'Sí' : 'No'}</Text>
        {item.pisoHormigon && (
          <>
            <Text style={styles.linea}>  Tipo: {valorONo(item.tipoHormigon)}</Text>
            <Text style={styles.linea}>  Espesor: {valorONo(item.espesorPiso)}</Text>
            <Text style={styles.linea}>  Terminación: {valorONo(item.terminacionPiso)}</Text>
          </>
        )}
      </View>

      <View style={styles.bloquePrecio}>
        <Text style={styles.precioLabel}>PRECIO TOTAL</Text>
        <Text style={styles.precioValor}>USD {item.precioFinal.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={styles.whatsappBtn}
        onPress={() => enviarPorWhatsApp(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.whatsappBtnText}>📱 ENVIAR POR WHATSAPP</Text>
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
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 280,
    marginBottom: 12,
  },
  whatsappBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  volverBtn: {
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  volverBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
