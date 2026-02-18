import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ItemHistorial } from './cotizar';

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

export default function HistorialScreen() {
  const router = useRouter();
  const [lista, setLista] = useState<ItemHistorial[]>([]);

  const cargarHistorial = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const data = raw ? JSON.parse(raw) : [];
      setLista(Array.isArray(data) ? data : []);
    } catch {
      setLista([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [cargarHistorial])
  );

  const eliminar = (id: number) => {
    Alert.alert(
      'Eliminar Cotización',
      '¿Estás seguro de que deseas borrar este proyecto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const nuevaLista = lista.filter((item) => item.id !== id);
            setLista(nuevaLista);
            await AsyncStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(nuevaLista));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        
        <Text style={styles.brandTitle}>HISTORIAL</Text>
        <Text style={styles.brandSubtitle}>Proyectos guardados en Quicksheed</Text>

        {lista.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.vacio}>No tienes cotizaciones guardadas aún.</Text>
          </View>
        ) : (
          lista.map((item) => (
            <View key={item.id} style={styles.tarjeta}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/history/${item.id}`)}
                style={styles.tarjetaContenido}
              >
                <View>
                  <Text style={styles.tarjetaNombre}>{item.nombreProyecto}</Text>
                  <Text style={styles.tarjetaFecha}>{formatearFecha(item.fecha)}</Text>
                </View>
                <View style={styles.precioContenedor}>
                  <Text style={styles.tarjetaPrecio}>USD {item.precioFinal.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.separador} />
              
              <TouchableOpacity
                style={styles.eliminarBtn}
                onPress={() => eliminar(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.eliminarBtnText}>BORRAR REGISTRO</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  
  // TÍTULOS
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#F59E0B', textAlign: 'center', marginTop: 20 },
  brandSubtitle: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginBottom: 24 },
  
  vacioContainer: { marginTop: 60, alignItems: 'center' },
  vacio: { fontSize: 16, color: '#555', textAlign: 'center' },

  // TARJETAS
  tarjeta: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
  },
  tarjetaContenido: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tarjetaNombre: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  tarjetaFecha: { fontSize: 13, color: '#A1A1AA' },
  
  precioContenedor: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tarjetaPrecio: { fontSize: 16, fontWeight: '800', color: '#F59E0B' },

  separador: { height: 1, backgroundColor: '#27272A' },

  // BOTÓN ELIMINAR
  eliminarBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  eliminarBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});