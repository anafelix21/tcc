import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme/colors';
import { cargarCatalogo, Opcion } from '../services/crudService';
import { Fuente } from '../modules/types';
import { estilosCampo } from './CampoTexto';

type Props = {
  etiqueta: string;
  fuente: Fuente;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  obligatorio?: boolean;
};

/** Campo que abre un buscador modal con registros de la API (cultivos, insumos, usuarios, actividades). */
export function SelectorEntidad({ etiqueta, fuente, valor, onChange, error, obligatorio }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarCatalogo(fuente)
      .then(setOpciones)
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, [fuente]);

  const seleccionada = opciones.find((o) => o.value === valor);
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? opciones.filter((o) => `${o.label} ${o.detalle ?? ''}`.toLowerCase().includes(q)) : opciones;
  }, [opciones, busqueda]);

  return (
    <View style={styles.contenedor}>
      <Text style={estilosCampo.etiqueta}>
        {etiqueta}
        {obligatorio ? <Text style={{ color: colors.brown }}> *</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar ${etiqueta}`}
        onPress={() => setAbierto(true)}
        style={[styles.campo, error ? { borderColor: colors.danger } : null]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.valor, !seleccionada && { color: '#B3AA9C' }]} numberOfLines={1}>
            {seleccionada ? seleccionada.label : valor ? `ID ${valor}` : `Seleccionar ${etiqueta.toLowerCase()}`}
          </Text>
          {seleccionada?.detalle ? <Text style={styles.detalle}>{seleccionada.detalle}</Text> : null}
        </View>
        <Text style={styles.flecha}>▾</Text>
      </Pressable>
      {error ? <Text style={estilosCampo.error}>{error}</Text> : null}

      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.hoja}>
            <View style={styles.cabecera}>
              <Text style={styles.tituloModal}>{etiqueta}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setAbierto(false)}>
                <Text style={styles.cerrar}>Cerrar</Text>
              </Pressable>
            </View>
            <TextInput style={styles.buscador} placeholder="Buscar..." placeholderTextColor="#B3AA9C" value={busqueda} onChangeText={setBusqueda} />
            {cargando ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={filtradas}
                keyExtractor={(o) => o.value}
                ListEmptyComponent={<Text style={styles.vacio}>{errorCarga ?? 'Sin resultados'}</Text>}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => { onChange(item.value); setAbierto(false); setBusqueda(''); }}
                    style={[styles.opcion, item.value === valor && styles.opcionActiva]}
                  >
                    <Text style={styles.opcionTexto}>{item.label}</Text>
                    {item.detalle ? <Text style={styles.detalle}>{item.detalle}</Text> : null}
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 16 },
  campo: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 11 },
  valor: { fontSize: 15, color: colors.text },
  detalle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  flecha: { fontSize: 18, color: colors.brown, marginLeft: 8 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(40,30,20,0.35)', justifyContent: 'flex-end' },
  hoja: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%', minHeight: '50%', padding: 16 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tituloModal: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  cerrar: { color: colors.primary, fontWeight: '700' },
  buscador: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: colors.text },
  opcion: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  opcionTexto: { fontSize: 15, fontWeight: '600', color: colors.text },
  vacio: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
