package io.nimtable;

import io.nimtable.iceberg.IcebergProto.MapType;
import io.nimtable.iceberg.IcebergProto.NestedFieldDescriptor;
import io.nimtable.iceberg.IcebergProto.PrimitiveType;
import io.nimtable.iceberg.IcebergProto.StructType;
import org.apache.iceberg.types.Type;
import org.apache.iceberg.types.Types;

public class TypeConverter {
    public static NestedFieldDescriptor convert(Types.NestedField field) {
        NestedFieldDescriptor.Builder builder =
                NestedFieldDescriptor.newBuilder()
                        .setId(field.fieldId())
                        .setName(field.name())
                        .setRequired(field.isRequired());

        Type type = field.type();
        if (type instanceof Type.PrimitiveType) {
            builder.setPrimitive(convertPrimitiveType((Type.PrimitiveType) type));
        } else if (type instanceof Types.ListType) {
            var listType = (Types.ListType) type;
            builder.setList(TypeConverter.convert(listType.fields().get(0)));
        } else if (type instanceof Types.MapType) {
            Types.MapType mapType = (Types.MapType) type;
            builder.setMap(
                    MapType.newBuilder()
                            .setKeyField(TypeConverter.convert((mapType.field(mapType.keyId()))))
                            .setValueField(
                                    TypeConverter.convert((mapType.field(mapType.valueId())))));
        } else if (type instanceof Types.StructType) {
            var structType = (Types.StructType) type;
            var structBuilder = StructType.newBuilder();
            for (Types.NestedField structField : structType.fields()) {
                structBuilder.addFields(TypeConverter.convert(structField));
            }
            builder.setStruct(structBuilder.build());
        } else {
            throw new IllegalArgumentException("Unsupported type: " + type);
        }

        return builder.build();
    }

    private static PrimitiveType convertPrimitiveType(Type.PrimitiveType type) {
        PrimitiveType.Builder builder = PrimitiveType.newBuilder();
        switch (type.typeId()) {
            case BOOLEAN:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.BOOLEAN);
                break;
            case INTEGER:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.INT);
                break;
            case LONG:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.LONG);
                break;
            case FLOAT:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.FLOAT);
                break;
            case DOUBLE:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.DOUBLE);
                break;
            case DATE:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.DATE);
                break;
            case TIME:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.TIME);
                break;
            case TIMESTAMP:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.TIMESTAMP);
                break;
            case STRING:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.STRING);
                break;
            case UUID:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.UUID);
                break;
            case FIXED:
                builder.setFixed(((Types.FixedType) type).length());
                break;
            case BINARY:
                builder.setKindWithoutInner(PrimitiveType.KindWithoutInner.BINARY);
                break;
            case DECIMAL:
                Types.DecimalType decimalType = (Types.DecimalType) type;
                builder.setDecimal(
                        PrimitiveType.Decimal.newBuilder()
                                .setPrecision(decimalType.precision())
                                .setScale(decimalType.scale())
                                .build());
                break;
            default:
                throw new IllegalArgumentException("Unsupported primitive type: " + type);
        }
        return builder.build();
    }
}
