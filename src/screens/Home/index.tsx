import { useState } from 'react';
import { Image, ScrollView, Text, View, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { styles } from './styles';

import { Tip } from '../../components/Tip';
import { Item, ItemProps } from '../../components/Item';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { Loading } from '../../components/Loading';
import { foodContains } from '../../utils/imageContains';

export function Home() {
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<ItemProps[]>([]);

  async function imageDetect(imageBase64: string | undefined ) {
    const res = await api.post(`/v2/models/${process.env.EXPO_PUBLIC_API_MODEL_ID}/versions/${process.env.EXPO_PUBLIC_API_MODEL_VERSION_ID}/outputs`, {
      "user_app_id": {
        "user_id": process.env.EXPO_PUBLIC_API_USER_ID,
        "app_id": process.env.EXPO_PUBLIC_API_ID,
      },
      "inputs": [
        {
          "data": {
            "image": {
              "base64": imageBase64
            }
          }
        }
      ]
    });

    const concepts = res.data.outputs[0].data.concepts.map((concept: any) => {
      return {
        name: concept.name,
        percentage: `${Math.round(concept.value * 100)}%`
      }
    });

    const isVegetable = foodContains(concepts, 'vegetable');
    setMessage(isVegetable ? '' : 'Adicione vegetais em seu prato');
    setItems(concepts);
    setIsLoading(false);
  }

  async function handleSelectImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // Garantindo permissão de acesso
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        return Alert.alert("É necessário conceder permissão para acessar seu album de fotos.");
      }

      setIsLoading(true);
      // Abringo seleção de imagem
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1
      });
      // verificação se desistiu da ação
      if (response.canceled) {
        setIsLoading(false);
        return;
      }

      if (!response.canceled) {
        const imgManipulated = await ImageManipulator.manipulateAsync(
          response.assets[0].uri,
          [{ resize: { width: 900} }],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        )
        setSelectedImageUri(imgManipulated.uri);
        imageDetect(imgManipulated.base64);
      }

    } catch(err) {

    }
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleSelectImage} disabled={isLoading} />

      {
        selectedImageUri ?
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          :
          <Text style={styles.description}>
            Selecione a foto do seu prato para analizar.
          </Text>
      }

      <View style={styles.bottom}>
        {
          isLoading ? (
            <Loading />
          ) : (
            <>
              {message && <Tip message={message} />}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 24 }}>
                <View style={styles.items}>
                  { items.length > 0 ? (
                    items.map(item => (
                      <Item key={item.name} data={{ name: item.name, percentage: item.percentage }} />
                    ))
                  ) : null}
                </View>
              </ScrollView>
            </>
          )
        }
      </View>
    </View>
  );
}