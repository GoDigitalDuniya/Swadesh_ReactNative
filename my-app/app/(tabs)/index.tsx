import { Redirect } from 'expo-router';

export default function Index() {
  // Immediately redirect to the loading page.
  return <Redirect href="/pages/loading" />;
}