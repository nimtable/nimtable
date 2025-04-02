/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.nimtable;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import io.nimtable.iceberg.CompactorServiceGrpc;
import io.nimtable.iceberg.IcebergProto.EchoRequest;
import io.nimtable.iceberg.IcebergProto.EchoResponse;
import java.util.concurrent.TimeUnit;

public class IcebergCompactionClient implements AutoCloseable {
    private final ManagedChannel channel;
    private final CompactorServiceGrpc.CompactorServiceBlockingStub blockingStub;

    public IcebergCompactionClient(String host, int port) {
        this(ManagedChannelBuilder.forAddress(host, port).usePlaintext().build());
    }

    public IcebergCompactionClient(ManagedChannel channel) {
        this.channel = channel;
        this.blockingStub = CompactorServiceGrpc.newBlockingStub(channel);
    }

    public void shutdown() throws InterruptedException {
        channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
    }

    public void echo(String message) {
        EchoRequest request = EchoRequest.newBuilder().setMessage(message).build();
        EchoResponse response;
        try {
            response = blockingStub.echo(request);
        } catch (StatusRuntimeException e) {
            System.out.println("RPC failed: " + e.getStatus());
            return;
        }
        System.out.println("Echo response: " + response.getMessage());
    }

    @Override
    public void close() throws InterruptedException {
        shutdown();
    }
}
