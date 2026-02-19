import { ConfigPrecios } from '@/utils/calculator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

// Activar animaciones en Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = '@cotizador_precios';

// --- LISTAS DE MEDIDAS ESTÁNDAR ---
const MEDIDAS_IPN = ['IPN 200', 'IPN 240', 'IPN 300', 'IPN 340', 'IPN 400', 'IPN 450', 'IPN 500'];
const MEDIDAS_W = ['W 200', 'W 250', 'W 310', 'W 360', 'W 410', 'W 460'];
const MEDIDAS_TUBO = ['100x100', '120x120', '140x140', '160x160', '180x180', '200x200', '220x220', '260x260'];
const MEDIDAS_PERFIL_C = ['C 80', 'C 100', 'C 120', 'C 140', 'C 160', 'C 180', 'C 200', 'C 220'];
const ALTURAS_RETICULADO = ['300 mm', '400 mm', '500 mm', '600 mm', '800 mm', '1000 mm'];
const MATERIALES_RETICULADO = ['Angulo', 'Hierro Redondo', 'Perfil C'];

// --- ESTADO INICIAL ---
const defaultPrecios: ConfigPrecios = {
  precioAcero: 0,
  precioChapa: 0,
  precioAislacion: 0,
  precioPanelIgnifugo: 0,
  
  precioEolico: 0,
  precioChapaTraslucida: 0,
  precioPuertaEmergencia: 0,
  precioEstudioSuelo: 0,
  precioHormigonH21: 0,
  precioHormigonH30: 0,
  precioMallaCima: 0,

  pesosIPN: {}, // Se llenará dinámicamente
  pesosW: {},
  pesosTubo: {},
  pesosPerfilC: {},
  pesosReticulado: {},

  tornilleriaFijaciones: 0,
  selladoresZingueria: 0,
  manoObraFabricacion: 0,
  montajeEstructura: 0,
  ingenieriaPlanos: 0,
  pinturaTratamiento: 0,
  mediosElevacion: 0,
  logisticaFletes: 0,
  viaticos: 0,
  
  margenGanancia: 0,
  imprevistosContingencia: 0,
};

// --- COMPONENTE ACORDEÓN ---
const AccordionSection = ({ 
  title, 
  children, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void; 
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
};

// --- COMPONENTE INPUT ROW ---
const InputRow = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "0.00",
  suffix
}: { 
  label: string; 
  value: number | undefined; 
  onChange: (val: string) => void; 
  placeholder?: string;
  suffix?: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.labelInput}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        keyboardType="numeric"
        value={value ? String(value) : ''}
        onChangeText={onChange}
      />
      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  </View>
);

export default function PreciosScreen() {
  const [precios, setPrecios] = useState<ConfigPrecios>(defaultPrecios);
  
  // Estado para controlar qué acordeón está abierto
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const loadPrecios = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Fusionamos con el default para asegurar que existan todas las claves nuevas
        setPrecios((prev) => ({
          ...defaultPrecios,
          ...parsed,
          // Aseguramos que los objetos anidados existan si el stored es viejo
          pesosIPN: { ...defaultPrecios.pesosIPN, ...parsed.pesosIPN },
          pesosW: { ...defaultPrecios.pesosW, ...parsed.pesosW },
          pesosTubo: { ...defaultPrecios.pesosTubo, ...parsed.pesosTubo },
          pesosPerfilC: { ...defaultPrecios.pesosPerfilC, ...parsed.pesosPerfilC },
          pesosReticulado: { ...defaultPrecios.pesosReticulado, ...parsed.pesosReticulado },
        }));
      }
    } catch (e) {
      console.error("Error cargando precios", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPrecios();
    }, [loadPrecios])
  );

  const guardar = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(precios));
      Alert.alert('Éxito', 'Configuración guardada correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  };

  // Helpers para actualizar estado
  const updateField = (key: keyof ConfigPrecios, val: string) => {
    setPrecios(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const updateNested = (parent: keyof ConfigPrecios, key: string, val: string) => {
    setPrecios(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<string, number>),
        [key]: parseFloat(val) || 0
      }
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.brandTitle}>CONFIGURACIÓN</Text>
        <Text style={styles.brandSubtitle}>Costos Unitarios y Pesos Específicos</Text>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1. MATERIALES BASE */}
        <AccordionSection 
          title="Costos Base (Acero/Chapa)" 
          isOpen={openSection === 'base'} 
          onToggle={() => toggleSection('base')}
        >
          <InputRow label="Precio Acero Base" value={precios.precioAcero} onChange={v => updateField('precioAcero', v)} suffix="USD/kg" />
          <InputRow label="Precio Chapa Cubierta" value={precios.precioChapa} onChange={v => updateField('precioChapa', v)} suffix="USD/m²" />
          <InputRow label="Precio Aislación Std" value={precios.precioAislacion} onChange={v => updateField('precioAislacion', v)} suffix="USD/m²" />
          <InputRow label="Precio Panel Ignífugo" value={precios.precioPanelIgnifugo} onChange={v => updateField('precioPanelIgnifugo', v)} suffix="USD/m²" />
        </AccordionSection>

        {/* 2. ACCESORIOS */}
        <AccordionSection 
          title="Accesorios y Extras" 
          isOpen={openSection === 'accesorios'} 
          onToggle={() => toggleSection('accesorios')}
        >
          <InputRow label="Extractor Eólico" value={precios.precioEolico} onChange={v => updateField('precioEolico', v)} suffix="USD c/u" />
          <InputRow label="Chapa Traslúcida" value={precios.precioChapaTraslucida} onChange={v => updateField('precioChapaTraslucida', v)} suffix="USD c/u" />
          <InputRow label="Puerta Emergencia" value={precios.precioPuertaEmergencia} onChange={v => updateField('precioPuertaEmergencia', v)} suffix="USD c/u" />
          <InputRow label="Estudio de Suelo" value={precios.precioEstudioSuelo} onChange={v => updateField('precioEstudioSuelo', v)} suffix="USD Global" />
        </AccordionSection>

        {/* 3. OBRA CIVIL */}
        <AccordionSection 
          title="Obra Civil (Hormigón)" 
          isOpen={openSection === 'civil'} 
          onToggle={() => toggleSection('civil')}
        >
          <InputRow label="Hormigón H21 (Liviano)" value={precios.precioHormigonH21} onChange={v => updateField('precioHormigonH21', v)} suffix="USD/m³" />
          <InputRow label="Hormigón H30 (Industrial)" value={precios.precioHormigonH30} onChange={v => updateField('precioHormigonH30', v)} suffix="USD/m³" />
          <InputRow label="Malla Cima" value={precios.precioMallaCima} onChange={v => updateField('precioMallaCima', v)} suffix="USD/m²" />
        </AccordionSection>

        {/* --- PESOS ESPECIFICOS --- */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>PESOS POR METRO LINEAL (kg/m)</Text>
        </View>

        {/* 4. PERFILES C */}
        <AccordionSection 
          title="Perfiles C (Correas y Estructura)" 
          isOpen={openSection === 'perfilC'} 
          onToggle={() => toggleSection('perfilC')}
        >
          {MEDIDAS_PERFIL_C.map(medida => (
            <InputRow 
              key={medida} 
              label={`Peso ${medida}`} 
              value={precios.pesosPerfilC[medida]} 
              onChange={v => updateNested('pesosPerfilC', medida, v)} 
              suffix="kg/m"
            />
          ))}
        </AccordionSection>

        {/* 5. PERFILES IPN */}
        <AccordionSection 
          title="Perfiles IPN (Alma Llena)" 
          isOpen={openSection === 'ipn'} 
          onToggle={() => toggleSection('ipn')}
        >
          {MEDIDAS_IPN.map(medida => (
            <InputRow 
              key={medida} 
              label={`Peso ${medida}`} 
              value={precios.pesosIPN[medida]} 
              onChange={v => updateNested('pesosIPN', medida, v)} 
              suffix="kg/m"
            />
          ))}
        </AccordionSection>

        {/* 6. PERFILES W */}
        <AccordionSection 
          title="Perfiles W (Alma Llena)" 
          isOpen={openSection === 'w'} 
          onToggle={() => toggleSection('w')}
        >
          {MEDIDAS_W.map(medida => (
            <InputRow 
              key={medida} 
              label={`Peso ${medida}`} 
              value={precios.pesosW[medida]} 
              onChange={v => updateNested('pesosW', medida, v)} 
              suffix="kg/m"
            />
          ))}
        </AccordionSection>

        {/* 7. TUBOS */}
        <AccordionSection 
          title="Tubos Estructurales" 
          isOpen={openSection === 'tubo'} 
          onToggle={() => toggleSection('tubo')}
        >
          {MEDIDAS_TUBO.map(medida => (
            <InputRow 
              key={medida} 
              label={`Peso ${medida}`} 
              value={precios.pesosTubo[medida]} 
              onChange={v => updateNested('pesosTubo', medida, v)} 
              suffix="kg/m"
            />
          ))}
        </AccordionSection>

        {/* 8. RETICULADOS (Matriz Compleja) */}
        <AccordionSection 
          title="Reticulados (Por Altura y Material)" 
          isOpen={openSection === 'reticulado'} 
          onToggle={() => toggleSection('reticulado')}
        >
          <Text style={styles.infoText}>Defina el peso aprox. por metro de la viga/columna terminada.</Text>
          {ALTURAS_RETICULADO.map(altura => (
            <View key={altura} style={styles.subSection}>
              <Text style={styles.subTitle}>{altura}</Text>
              {MATERIALES_RETICULADO.map(material => {
                const key = `${altura}_${material}`;
                return (
                  <InputRow 
                    key={key}
                    label={`Con ${material}`} 
                    value={precios.pesosReticulado[key]} 
                    onChange={v => updateNested('pesosReticulado', key, v)} 
                    suffix="kg/m"
                  />
                );
              })}
            </View>
          ))}
        </AccordionSection>

        {/* 9. MANO DE OBRA Y LOGISTICA */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>MANO DE OBRA Y SERVICIOS</Text>
        </View>

        <AccordionSection 
          title="Fabricación y Montaje" 
          isOpen={openSection === 'mo'} 
          onToggle={() => toggleSection('mo')}
        >
          <InputRow label="Fabricación" value={precios.manoObraFabricacion} onChange={v => updateField('manoObraFabricacion', v)} suffix="USD/kg" />
          <InputRow label="Montaje en Obra" value={precios.montajeEstructura} onChange={v => updateField('montajeEstructura', v)} suffix="USD/m²" />
          <InputRow label="Pintura/Tratamiento" value={precios.pinturaTratamiento} onChange={v => updateField('pinturaTratamiento', v)} suffix="USD/m²" />
        </AccordionSection>

        <AccordionSection 
          title="Logística y Otros" 
          isOpen={openSection === 'logistica'} 
          onToggle={() => toggleSection('logistica')}
        >
          <InputRow label="Flete (km)" value={precios.logisticaFletes} onChange={v => updateField('logisticaFletes', v)} suffix="USD/km" />
          <InputRow label="Medios Elevación" value={precios.mediosElevacion} onChange={v => updateField('mediosElevacion', v)} suffix="USD Global" />
          <InputRow label="Ingeniería/Planos" value={precios.ingenieriaPlanos} onChange={v => updateField('ingenieriaPlanos', v)} suffix="USD Global" />
          <InputRow label="Viáticos" value={precios.viaticos} onChange={v => updateField('viaticos', v)} suffix="USD Global" />
          <InputRow label="Tornillería" value={precios.tornilleriaFijaciones} onChange={v => updateField('tornilleriaFijaciones', v)} suffix="USD Global" />
          <InputRow label="Selladores Zinguería" value={precios.selladoresZingueria} onChange={v => updateField('selladoresZingueria', v)} suffix="USD/m" />
        </AccordionSection>

        {/* 10. MARGENES */}
        <AccordionSection 
          title="Márgenes de Ganancia" 
          isOpen={openSection === 'margenes'} 
          onToggle={() => toggleSection('margenes')}
        >
          <InputRow label="Ganancia Neta" value={precios.margenGanancia} onChange={v => updateField('margenGanancia', v)} suffix="%" />
          <InputRow label="Imprevistos" value={precios.imprevistosContingencia} onChange={v => updateField('imprevistosContingencia', v)} suffix="%" />
        </AccordionSection>

        <TouchableOpacity style={styles.saveButton} onPress={guardar} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>GUARDAR TODA LA CONFIGURACIÓN</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#27272A' },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#F59E0B', letterSpacing: 1 },
  brandSubtitle: { fontSize: 13, color: '#A1A1AA' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  
  // Headers de Sección
  sectionHeaderContainer: { marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  sectionHeaderText: { color: '#71717A', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Cards / Acordeones
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272A' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#27272A' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#E4E4E7' },
  chevron: { color: '#F59E0B', fontSize: 12 },
  accordionContent: { padding: 16, backgroundColor: '#1E1E1E' },

  // Inputs
  inputContainer: { marginBottom: 16 },
  labelInput: { color: '#A1A1AA', fontSize: 13, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 8, borderWidth: 1, borderColor: '#3F3F46' },
  input: { flex: 1, color: '#fff', padding: 12, fontSize: 16 },
  suffix: { color: '#52525B', paddingRight: 12, fontSize: 13, fontWeight: '600' },

  // Subsecciones (Reticulados)
  subSection: { marginBottom: 20, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#3F3F46' },
  subTitle: { color: '#F59E0B', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  infoText: { color: '#52525B', fontSize: 12, marginBottom: 12, fontStyle: 'italic' },

  // Botón
  saveButton: { backgroundColor: '#F59E0B', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 24, shadowColor: '#F59E0B', shadowOpacity: 0.2, shadowRadius: 5 },
  saveButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});