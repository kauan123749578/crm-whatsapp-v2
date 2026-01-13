import { WhatsAppService } from './whatsappService.js';

// Mapa para armazenar instâncias ativas
const instances = new Map();
// Evita inicialização concorrente da mesma instância (causa "browser already running")
const creating = new Map(); // instanceName -> Promise<WhatsAppService>

/**
 * Obtém ou cria uma instância do WhatsApp
 */
export async function getOrCreateInstance(instanceName) {
  if (creating.has(instanceName)) {
    return await creating.get(instanceName);
  }
  if (!instances.has(instanceName)) {
    console.log(`[InstanceManager] Criando nova instância: ${instanceName}`);
    const promise = (async () => {
      const service = new WhatsAppService(instanceName);

      try {
        await service.initialize();
        instances.set(instanceName, service);
        console.log(`[InstanceManager] Instância ${instanceName} criada com sucesso`);
        return service;
      } catch (error) {
        console.error(`[InstanceManager] Erro ao criar instância ${instanceName}:`, error);
        try {
          await service.destroy();
        } catch {
          // ignore
        }
        throw error;
      } finally {
        creating.delete(instanceName);
      }
    })();

    creating.set(instanceName, promise);
    return await promise;
  }

  return instances.get(instanceName);
}

/**
 * Obtém uma instância existente
 */
export function getInstance(instanceName) {
  return instances.get(instanceName);
}

/**
 * Verifica se uma instância existe
 */
export function hasInstance(instanceName) {
  return instances.has(instanceName);
}

/**
 * Remove uma instância
 */
export async function removeInstance(instanceName) {
  const instance = instances.get(instanceName);
  if (instance) {
    try {
      await instance.destroy();
      instances.delete(instanceName);
      console.log(`[InstanceManager] Instância ${instanceName} removida`);
      return true;
    } catch (error) {
      console.error(`[InstanceManager] Erro ao remover instância ${instanceName}:`, error);
      return false;
    }
  }
  return false;
}

/**
 * Lista todas as instâncias ativas
 */
export function listInstances() {
  return Array.from(instances.keys());
}

/**
 * Limpa todas as instâncias
 */
export async function clearAllInstances() {
  const instanceNames = Array.from(instances.keys());
  const results = await Promise.all(instanceNames.map((name) => removeInstance(name)));
  return results.every((r) => r);
}

