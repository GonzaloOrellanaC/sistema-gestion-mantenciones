import { IonContent, IonFab, IonFabButton, IonIcon, IonModal } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

type MyPDFModalProps = {
  pdfUrl: string | null;
  onDidDismiss: () => void;
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  }
});

export const MyPDFModal: React.FC<MyPDFModalProps> = ({ pdfUrl, onDidDismiss }) => {
  return (
    <IonModal isOpen={!!pdfUrl} onDidDismiss={onDidDismiss} className="pdf-modal">
        <IonContent className="ion-text-center" style={{ padding: 0, height: '100%' }}>
            <IonFab vertical="top" horizontal="end" slot="fixed">
                <IonFabButton size="small" color={'dark'} onClick={onDidDismiss} style={{ marginTop: 12, marginLeft: 12 }}>
                    <IonIcon icon={closeOutline} color={'light'} />
                </IonFabButton>
            </IonFab>
            <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text>Section #1</Text>
                </View>
                <View style={styles.section}>
                    <Text>Section #2</Text>
                </View>
            </Page>
        </Document>
        </IonContent>
    </IonModal>
    );
};