import { formatearMoneda } from '@/utils/calculator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY_HISTORIAL = '@cotizador_historial';

export default function HistorialScreen() {
  const router = useRouter();
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar historial cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [])
  );

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const data = jsonValue != null ? JSON.parse(jsonValue) : [];
      setHistorial(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  const borrarTodo = async () => {
    Alert.alert(
      'Borrar Historial',
      '¿Estás seguro de que quieres eliminar todas las cotizaciones guardadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY_HISTORIAL);
              setHistorial([]);
            } catch {
              Alert.alert('Error', 'No se pudo borrar.');
            }
          },
        },
      ]
    );
  };

  const formatearFecha = (iso: string) => {
    if (!iso) return '-';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // --- FIX DEL ERROR "UNDEFINED" ---
    // Verificamos si existe item.total, si no, intentamos con precioFinal (versiones viejas), o usamos 0.
    const precio =
      typeof item.total === 'number'
        ? item.total
        : typeof item.precioFinal === 'number'
        ? item.precioFinal
        : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/history/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.nombreProyecto || 'Proyecto Sin Nombre'}
          </Text>
          <Text style={styles.cardDate}>{formatearFecha(item.fecha)}</Text>
        </View>

        <View style={styles.cardBody}>
          {/* Mostramos dimensiones básicas si existen */}
          <Text style={styles.cardInfo}>
            {item.datosInput?.ancho || '?'}m x {item.datosInput?.largo || '?'}m
          </Text>
          {/* APLICAMOS LA FUNCIÓN DE FORMATO AQUÍ */}
          <Text style={styles.cardPrice}>USD {formatearMoneda(precio)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HISTORIAL</Text>
        <TouchableOpacity onPress={borrarTodo} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Borrar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay cotizaciones guardadas.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: { padding: 5 },
  backText: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  deleteButton: { padding: 5 },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' }, 

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  cardDate: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    color: '#71717A',
    fontSize: 14,
  },
  cardPrice: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
  },
});