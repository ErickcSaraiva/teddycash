import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react';

import * as SecureStore from 'expo-secure-store';

import { authApi } from '../services/authApi';


interface AuthContextData {
  token: string | null;
  userId: string | null;

  login(
    email: string,
    password: string
  ): Promise<void>;

  signOut(): Promise<void>;

  isLoading: boolean;
}


const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);



export function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {

  const [token, setToken] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    async function loadAuth() {

      try {

        const storedToken =
          await SecureStore.getItemAsync(
            'teddycash_token'
          );


        const storedUser =
          await SecureStore.getItemAsync(
            'teddycash_user'
          );


        if (storedToken) {
          setToken(storedToken);
        }


        if (storedUser) {
          setUserId(storedUser);
        }


      } catch(error) {

        console.log(
          'Erro carregando autenticação:',
          error
        );

      } finally {

        setIsLoading(false);

      }

    }


    loadAuth();

  }, []);



  async function login(
    email:string,
    password:string
  ) {

    const response =
      await authApi.login(
        email,
        password
      );


    await SecureStore.setItemAsync(
      'teddycash_token',
      response.access_token
    );


    await SecureStore.setItemAsync(
      'teddycash_user',
      response.user_id
    );


    setToken(response.access_token);

    setUserId(response.user_id);

  }



  async function signOut(){

    await SecureStore.deleteItemAsync(
      'teddycash_token'
    );


    await SecureStore.deleteItemAsync(
      'teddycash_user'
    );


    setToken(null);

    setUserId(null);

  }



return (

<AuthContext.Provider

value={{
token,
userId,
login,
signOut,
isLoading
}}

>

{children}

</AuthContext.Provider>

);


}



export function useAuth(){

return useContext(AuthContext);

}