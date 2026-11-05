'use client';

import { createTheme } from '@mui/material/styles';

export const docsTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e95420' },
    secondary: { main: '#9a9996' },
    background: { default: '#2b2b2b', paper: '#303030' },
    text: { primary: '#deddda', secondary: '#9a9996' },
    divider: '#1b1b1b',
    error: { main: '#e01b24' },
    action: {
      hover: 'rgba(255,255,255,0.07)',
      selected: 'rgba(233,84,32,0.25)',
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
          background: '#555',
          borderRadius: 6,
          border: '2px solid #2b2b2b',
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
          backgroundColor: '#383838',
          border: '1px solid #1b1b1b',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
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
        paper: { backgroundColor: '#303030', border: '1px solid #1b1b1b' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#1b1b1b', paddingTop: 4, paddingBottom: 4 },
        head: { backgroundColor: '#262626', color: '#9a9996' },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});
