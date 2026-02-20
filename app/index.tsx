import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InicioScreen() {
  const router = useRouter();

  // --- LÓGICA DEL ESCUDO LEGAL ---
  const handleNuevaCotizacion = async () => {
    try {
      // 1. Leemos la configuración guardada en el teléfono
      const stored = await AsyncStorage.getItem('@cotizador_precios');
      const config = stored ? JSON.parse(stored) : {};

      // 2. Verificamos si faltan los precios clave (Acero, Chapa, Mano de Obra, Hormigón)
      const faltanPrecios = 
        !config.precioAceroEstructural || 
        !config.precioChapa || 
        !config.manoObraFabricacion || 
        !config.precioHormigonH21;

      // 3. Disparamos el Escudo Legal si falta algún dato
      if (faltanPrecios) {
        Alert.alert(
          'DESLINDE DE RESPONSABILIDAD: VALORES ILUSTRATIVOS',
          'Los montos calculados por esta herramienta son de carácter estrictamente ilustrativo y se basan en promedios referenciales de mercado en Argentina. Los mismos no representan una oferta comercial vinculante ni un presupuesto técnico final.\n\nEs responsabilidad exclusiva del usuario verificar y cargar sus costos reales (Acero, Chapa, Hormigón y Mano de Obra) en la sección "Configurar Precios" antes de emitir cualquier informe. El uso de esta información es bajo riesgo del usuario y los resultados están sujetos a cambios sin previo aviso.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Estoy de acuerdo',
              onPress: () => router.push('/cotizar'),
            },
          ]
        );
      } else {
        // Si ya completó todos los precios base, lo dejamos pasar directo
        router.push('/cotizar');
      }
    } catch (error) {
      // Si ocurre un error de memoria, mostramos un aviso por seguridad
      Alert.alert(
        'Aviso de Seguridad',
        'No pudimos verificar sus precios configurados. Proceda con precaución.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => router.push('/cotizar') }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Ajusta la barra de estado para que se vea blanca sobre fondo negro */}
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* TÍTULO DE LA MARCA */}
      <Text style={styles.brandTitle}>QUICKSHEED</Text>
      <Text style={styles.brandSubtitle}>Cotizador de Estructuras Metálicas</Text>

      {/* BOTONES: TODOS CON EL MISMO ESTILO GRIS OSCURO */}
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={handleNuevaCotizacion}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>Nueva Cotización</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => router.push('/historial')}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>Historial de Proyectos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => router.push('/precios')}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>Configurar Precios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#121212', // Fondo Negro
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F59E0B', // Naranja Industrial
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#A1A1AA', // Gris suave
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  // ESTILO UNIFICADO PARA TODOS LOS BOTONES
  secondaryButton: {
    backgroundColor: '#1E1E1E', // Gris oscuro
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  secondaryButtonText: {
    color: '#E4E4E7', // Blanco hueso
    fontSize: 16,
    fontWeight: '600',
  },
});