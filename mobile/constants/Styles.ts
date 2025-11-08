import { StyleSheet } from 'react-native'
import { Colors } from './Colors'

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingTop: 20,
  },
  card: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.accent.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
})








