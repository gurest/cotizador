import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
      Alert.alert('Listo', 'Precios actualizados');
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Grupo 1: Materiales Base */}
        <Text style={styles.sectionTitle}>Materiales Base</Text>
        <Text style={styles.labelInput}>Precio Acero (USD/kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio Acero (USD/kg)"
          value={precios.precioAcero}
          onChangeText={(v) => updateCampo('precioAcero', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Precio Chapa (USD/m²)</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio Chapa (USD/m²)"
          value={precios.precioChapa}
          onChangeText={(v) => updateCampo('precioChapa', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Precio Aislación (USD/m²)</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio Aislación (USD/m²)"
          value={precios.precioAislacion}
          onChangeText={(v) => updateCampo('precioAislacion', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Tornillería y Fijaciones (USD Global o %)</Text>
        <TextInput
          style={styles.input}
          placeholder="Tornillería y Fijaciones (USD Global o %)"
          value={precios.tornilleriaFijaciones}
          onChangeText={(v) => updateCampo('tornilleriaFijaciones', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Selladores y Zinguería (USD por Metro Lineal)</Text>
        <TextInput
          style={styles.input}
          placeholder="Selladores y Zinguería (USD por Metro Lineal)"
          value={precios.selladoresZingueria}
          onChangeText={(v) => updateCampo('selladoresZingueria', v)}
          keyboardType="decimal-pad"
        />

        {/* Grupo 2: Mano de Obra y Servicios */}
        <Text style={styles.sectionTitle}>Mano de Obra y Servicios</Text>
        <Text style={styles.labelInput}>Mano de Obra Fabricación (USD/kg o Global)</Text>
        <TextInput
          style={styles.input}
          placeholder="Mano de Obra Fabricación (USD/kg o Global)"
          value={precios.manoObraFabricacion}
          onChangeText={(v) => updateCampo('manoObraFabricacion', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Montaje de Estructura (USD/m² de planta)</Text>
        <TextInput
          style={styles.input}
          placeholder="Montaje de Estructura (USD/m² de planta)"
          value={precios.montajeEstructura}
          onChangeText={(v) => updateCampo('montajeEstructura', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Ingeniería y Planos (USD Global)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingeniería y Planos (USD Global)"
          value={precios.ingenieriaPlanos}
          onChangeText={(v) => updateCampo('ingenieriaPlanos', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Pintura o Tratamiento (USD/m² o kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Pintura o Tratamiento (USD/m² o kg)"
          value={precios.pinturaTratamiento}
          onChangeText={(v) => updateCampo('pinturaTratamiento', v)}
          keyboardType="decimal-pad"
        />

        {/* Grupo 3: Logística y Equipos */}
        <Text style={styles.sectionTitle}>Logística y Equipos</Text>
        <Text style={styles.labelInput}>Medios de Elevación - Grúas/Tijeras (USD Global)</Text>
        <TextInput
          style={styles.input}
          placeholder="Medios de Elevación - Grúas/Tijeras (USD Global)"
          value={precios.mediosElevacion}
          onChangeText={(v) => updateCampo('mediosElevacion', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Logística y Fletes (USD por km o Global)</Text>
        <TextInput
          style={styles.input}
          placeholder="Logística y Fletes (USD por km o Global)"
          value={precios.logisticaFletes}
          onChangeText={(v) => updateCampo('logisticaFletes', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Viáticos - Comida/Alojamiento cuadrilla (USD Global)</Text>
        <TextInput
          style={styles.input}
          placeholder="Viáticos - Comida/Alojamiento cuadrilla (USD Global)"
          value={precios.viaticos}
          onChangeText={(v) => updateCampo('viaticos', v)}
          keyboardType="decimal-pad"
        />

        {/* Grupo 4: Márgenes */}
        <Text style={styles.sectionTitle}>Márgenes</Text>
        <Text style={styles.labelInput}>Margen de Ganancia (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Margen de Ganancia (%)"
          value={precios.margenGanancia}
          onChangeText={(v) => updateCampo('margenGanancia', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.labelInput}>Imprevistos / Contingencia (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Imprevistos / Contingencia (%)"
          value={precios.imprevistosContingencia}
          onChangeText={(v) => updateCampo('imprevistosContingencia', v)}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.button} onPress={guardar} activeOpacity={0.8}>
          <Text style={styles.buttonText}>GUARDAR CONFIGURACIÓN</Text>
        </TouchableOpacity>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#c4c4c4' },
  scroll: { flex: 1, backgroundColor: '#c4c4c4' },
  scrollContent: { padding: 16, paddingBottom: 32, maxWidth: 500, width: '100%', alignSelf: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#1e293b',
  },
  labelInput: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  bottomPadding: { height: 24 },
});
