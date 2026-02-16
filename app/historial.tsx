import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
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
      'Eliminar',
      '¿Eliminar esta cotización del historial?',
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Historial de cotizaciones</Text>
      {lista.length === 0 ? (
        <Text style={styles.vacio}>No hay cotizaciones guardadas.</Text>
      ) : (
        lista.map((item) => (
          <View key={item.id} style={styles.tarjeta}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/history/${item.id}`)}
            >
              <Text style={styles.tarjetaNombre}>{item.nombreProyecto}</Text>
              <Text style={styles.tarjetaFecha}>{formatearFecha(item.fecha)}</Text>
              <Text style={styles.tarjetaPrecio}>USD {item.precioFinal.toFixed(2)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.eliminarBtn}
              onPress={() => eliminar(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.eliminarBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#c4c4c4' },
  container: { padding: 16, paddingBottom: 32 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  vacio: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 24 },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tarjetaNombre: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  tarjetaFecha: { fontSize: 14, color: '#666', marginBottom: 4 },
  tarjetaPrecio: { fontSize: 18, fontWeight: '700', color: '#0c4a6e', marginBottom: 10 },
  eliminarBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  eliminarBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
