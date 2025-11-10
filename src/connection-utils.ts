/**
 * Utility functions for working with Alloy connections
 */

export interface Connection {
  id?: string;
  _id?: string;
  credentialId?: string;
  connectionId?: string;
  connectorId?: string;
  connector?: string;
  integrationId?: string;
  type?: string;
  name?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

/**
 * Extract connection ID from a connection object
 * Prioritizes credentialId, then id, then _id
 */
export function getConnectionId(conn: Connection): string | undefined {
  return conn.credentialId || conn.id || conn._id || conn.connectionId;
}

/**
 * Extract connector ID from a connection object
 */
export function getConnectorId(conn: Connection): string {
  return conn.connectorId || conn.connector || conn.integrationId || 'unknown';
}

/**
 * Check if a connection is a Notion connection
 */
export function isNotionConnection(conn: Connection): boolean {
  const connectorId = getConnectorId(conn).toLowerCase();
  const type = (conn.type || '').toLowerCase();
  const name = (conn.name || '').toLowerCase();
  
  return (
    connectorId === 'notion' ||
    type === 'notion-oauth2' ||
    type.includes('notion') ||
    name.includes('notion')
  );
}

/**
 * Filter connections for Notion
 */
export function filterNotionConnections(connections: Connection[]): Connection[] {
  return connections.filter(isNotionConnection);
}

/**
 * Sort connections by creation date (most recent first)
 */
export function sortConnectionsByDate(connections: Connection[]): Connection[] {
  return connections.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Get the most recent connection from a list
 */
export function getMostRecentConnection(connections: Connection[]): Connection | undefined {
  if (connections.length === 0) return undefined;
  return sortConnectionsByDate(connections)[0];
}

/**
 * Format connection for display
 */
export function formatConnection(conn: Connection, index?: number): string {
  const connectionId = getConnectionId(conn) || 'N/A';
  const connectorId = getConnectorId(conn);
  const name = conn.name || `Connection ${index !== undefined ? index + 1 : ''}`;
  
  return [
    `  Connection ID (credentialId): ${connectionId}`,
    `  Connector ID: ${connectorId}`,
    `  Name: ${name}`,
    `  Type: ${conn.type || 'N/A'}`,
    `  Created: ${conn.createdAt || conn.created_at || 'N/A'}`,
    `  Status: ${conn.status || 'N/A'}`,
  ].join('\n');
}

