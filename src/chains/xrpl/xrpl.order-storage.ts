import { LocalStorage } from '../../services/local-storage';
import { ReferenceCountingCloseable } from '../../services/refcounting-closeable';
import { Order } from '../../connectors/xrpl/xrpl.types';
import { OrderStatus } from '../../connectors/xrpl/xrpl.types';

// store the order for when a transaction was initiated
// this will be used to monitor the order status when
// the order is included in the orderbook on XRP Ledger
export class XRPLOrderStorage extends ReferenceCountingCloseable {
  readonly localStorage: LocalStorage;

  protected constructor(dbPath: string) {
    super(dbPath);
    this.localStorage = LocalStorage.getInstance(dbPath, this.handle);
  }

  public async init(): Promise<void> {
    await this.localStorage.init();
  }

  public async saveOrder(
    chain: string,
    chainId: string,
    order: Order
  ): Promise<void> {
    return this.localStorage.save(
      chain + '/' + chainId + '/' + order.hash,
      JSON.stringify(order)
    );
  }

  public async deleteOrder(
    chain: string,
    chainId: string,
    order: Order
  ): Promise<void> {
    return this.localStorage.del(chain + '/' + chainId + '/' + order.hash);
  }

  public async getOrders(
    chain: string,
    chainId: string
  ): Promise<Record<string, Order>> {
    return this.localStorage.get((key: string, value: string) => {
      const splitKey = key.split('/');
      if (
        splitKey.length === 3 &&
        splitKey[0] === chain &&
        splitKey[1] === chainId
      ) {
        return [splitKey[2], JSON.parse(value)];
      }
      return;
    });
  }

  public async getOrdersByState(
    chain: string,
    chainId: string,
    state: OrderStatus
  ): Promise<Record<string, Order>> {
    return this.localStorage.get((key: string, value: string) => {
      const splitKey = key.split('/');
      if (
        splitKey.length === 3 &&
        splitKey[0] === chain &&
        splitKey[1] === chainId
      ) {
        const order: Order = JSON.parse(value);
        if (order.state === state) {
          return [splitKey[2], order];
        }
      }
      return;
    });
  }

  public async close(handle: string): Promise<void> {
    await super.close(handle);
    if (this.refCount < 1) {
      await this.localStorage.close(this.handle);
    }
  }
}
