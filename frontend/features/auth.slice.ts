import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserResponse } from "@/schemas/user.schema";
import { authService } from "@/services/auth.service";
import { LoginInput, SignupInput } from "@/schemas/auth.schema";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  // True only while the application is determining
  // whether an existing session is available.
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,
};

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to authenticate",
      );
    }
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (data: LoginInput, { rejectWithValue, dispatch }) => {
    try {
      const tokens = await authService.login(data);
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      return await dispatch(fetchMeThunk()).unwrap();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || "Login failed");
    }
  },
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (data: SignupInput, { rejectWithValue, dispatch }) => {
    try {
      await authService.signup(data);
      // After signup, log in directly
      return await dispatch(
        loginThunk({ email: data.email, password: data.password }),
      ).unwrap();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || "Signup failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    initializationSkipped(state) {
      state.isInitializing = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // --------------------------------------------------
      // Application authentication initialization
      // --------------------------------------------------

      .addCase(fetchMeThunk.pending, (state) => {
        state.isInitializing = true;
        state.error = null;
      })

      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitializing = false;
        state.error = null;
      })

      .addCase(fetchMeThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })

      // --------------------------------------------------
      // Login
      // --------------------------------------------------

      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })

      .addCase(loginThunk.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // --------------------------------------------------
      // Signup
      // --------------------------------------------------

      .addCase(signupThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(signupThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })

      .addCase(signupThunk.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setAuthLoading, initializationSkipped } =
  authSlice.actions;
export default authSlice.reducer;
