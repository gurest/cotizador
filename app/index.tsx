import { useRouter } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InicioScreen() {
  const router = useRouter();

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
        onPress={() => router.push('/cotizar')}
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