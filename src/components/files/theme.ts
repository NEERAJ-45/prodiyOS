'use client';

import { createTheme } from '@mui/material/styles';

export const docsTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#c25a33' },
    secondary: { main: '#8a8a8a' },
    background: { default: '#0a0a0a', paper: '#141414' },
    text: { primary: '#d6d6d6', secondary: '#8a8a8a' },
    divider: '#232323',
    error: { main: '#b96a6a' },
    action: {
      hover: 'rgba(255,255,255,0.05)',
      selected: 'rgba(194,90,51,0.18)',
    },
  },
  typography: {
    fontFamily:
      'Ubuntu, Cantarell, "Segoe UI", system-ui, -apple-system, sans-serif',
    fontSize: 13,
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '& ::-webkit-scrollbar': { width: 10, height: 10 },
        '& ::-webkit-scrollbar-thumb': {
          background: '#3a3a3a',
          borderRadius: 6,
          border: '2px solid #0a0a0a',
        },
        '& ::-webkit-scrollbar-track': { background: 'transparent' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1e1e',
          border: '1px solid #232323',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: 13, minHeight: 32 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: '#141414', border: '1px solid #232323' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#232323', paddingTop: 4, paddingBottom: 4 },
        head: { backgroundColor: '#1a1a1a', color: '#8a8a8a' },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});
