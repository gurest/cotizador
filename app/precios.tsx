import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY = '@cotizador_precios';

const defaultPrecios = {
  precioAcero: '',
  precioChapa: '',
  precioAislacion: '',
  precioIgnifugo: '', // NUEVO
  precioTraslucida: '', // NUEVO
  precioEolico: '', // NUEVO
  precioPuertaEmergencia: '', // NUEVO
  precioEstudioSuelo: '', // NUEVO
  tornilleriaFijaciones: '',
  selladoresZingueria: '',
  manoObraFabricacion: '',
  montajeEstructura: '',
  ingenieriaPlanos: '',
  pinturaTratamiento: '',
  mediosElevacion: '',
  logisticaFletes: '',
  viaticos: '',
  margenGanancia: '',
  imprevistosContingencia: '',
};

type PreciosState = typeof defaultPrecios;

export default function PreciosScreen() {
  const [precios, setPrecios] = useState<PreciosState>(defaultPrecios);

  const loadPrecios = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PreciosState>;
        setPrecios((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadPrecios();
  }, [loadPrecios]);

  const updateCampo = useCallback((key: keyof PreciosState, value: string) => {
    setPrecios((prev) => ({ ...prev, [key]: value }));
  }, []);

  const guardar = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(precios));
      Alert.alert('Éxito', 'Precios globales actualizados correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  }, [precios]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brandTitle}>CONFIGURACIÓN</Text>
        <Text style={styles.brandSubtitle}>Valores base para Quicksheed</Text>

        {/* Grupo 1: Materiales y Cubiertas */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Materiales y Cubiertas</Text>
          
          <Text style={styles.labelInput}>Precio Acero (USD/kg)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioAcero} onChangeText={(v) => updateCampo('precioAcero', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Precio Chapa (USD/m²)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioChapa} onChangeText={(v) => updateCampo('precioChapa', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Precio Aislación Estándar (USD/m²)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioAislacion} onChangeText={(v) => updateCampo('precioAislacion', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Precio Panel Ignífugo (USD/m²)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioIgnifugo} onChangeText={(v) => updateCampo('precioIgnifugo', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Chapa Traslúcida (USD/unidad)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioTraslucida} onChangeText={(v) => updateCampo('precioTraslucida', v)} keyboardType="decimal-pad" />
        </View>

        {/* Grupo 2: Componentes y Extras */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Componentes y Extras</Text>
          
          <Text style={styles.labelInput}>Extractor Eólico (USD/unidad)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioEolico} onChangeText={(v) => updateCampo('precioEolico', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Puerta Emergencia (USD/unidad)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioPuertaEmergencia} onChangeText={(v) => updateCampo('precioPuertaEmergencia', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Estudio de Suelo (USD Global)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.precioEstudioSuelo} onChangeText={(v) => updateCampo('precioEstudioSuelo', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Tornillería y Fijaciones (USD o %)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.tornilleriaFijaciones} onChangeText={(v) => updateCampo('tornilleriaFijaciones', v)} keyboardType="decimal-pad" />
        </View>

        {/* Grupo 3: Mano de Obra y Logística */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mano de Obra y Logística</Text>
          
          <Text style={styles.labelInput}>Fabricación (USD/kg o Global)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.manoObraFabricacion} onChangeText={(v) => updateCampo('manoObraFabricacion', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Montaje (USD/m²)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.montajeEstructura} onChangeText={(v) => updateCampo('montajeEstructura', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Flete (USD por km)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.logisticaFletes} onChangeText={(v) => updateCampo('logisticaFletes', v)} keyboardType="decimal-pad" />

          <Text style={styles.labelInput}>Medios Elevación (USD/Hora o Global)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" value={precios.mediosElevacion} onChangeText={(v) => updateCampo('mediosElevacion', v)} keyboardType="decimal-pad" />
        </View>

        {/* Grupo 4: Márgenes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Márgenes de Utilidad</Text>
          <Text style={styles.labelInput}>Ganancia (%)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" value={precios.margenGanancia} onChangeText={(v) => updateCampo('margenGanancia', v)} keyboardType="decimal-pad" />
          
          <Text style={styles.labelInput}>Imprevistos (%)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" value={precios.imprevistosContingencia} onChangeText={(v) => updateCampo('imprevistosContingencia', v)} keyboardType="decimal-pad" />
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Los valores aquí guardados se aplicarán por defecto a cada nueva cotización.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={guardar} activeOpacity={0.8}>
          <Text style={styles.buttonText}>GUARDAR PRECIOS GLOBALES</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  scroll: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#F59E0B', textAlign: 'center', marginTop: 20 },
  brandSubtitle: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 24 },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, textTransform: 'uppercase' },
  labelInput: { fontSize: 13, color: '#A1A1AA', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '800' },
  warningContainer: {
    padding: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 20,
  },
  warningText: { color: '#F59E0B', fontSize: 13, textAlign: 'center' },
  bottomPadding: { height: 40 },
});